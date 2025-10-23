const AWS = require('aws-sdk');

// CloudWatch for security event logging
const cloudwatch = new AWS.CloudWatchLogs();
const LOG_GROUP_NAME = process.env.SECURITY_LOG_GROUP || '/aws/lambda/scam-hunt-security';

class LambdaSecurityMiddleware {
    constructor(config = {}) {
        this.maxRequestSize = config.maxRequestSize || 10 * 1024 * 1024; // 10MB
        this.allowedOrigins = config.allowedOrigins || ['*'];
        this.enableSecurityHeaders = config.enableSecurityHeaders !== false;
        this.enableInputValidation = config.enableInputValidation !== false;
        this.enableSecurityLogging = config.enableSecurityLogging !== false;
    }

    async validateRequest(event) {
        const errors = [];

        // Check request size
        if (event.body) {
            const bodySize = event.isBase64Encoded 
                ? Buffer.from(event.body, 'base64').length 
                : Buffer.byteLength(event.body, 'utf8');
                
            if (bodySize > this.maxRequestSize) {
                errors.push({
                    type: 'request_too_large',
                    message: `Request size ${bodySize} exceeds maximum ${this.maxRequestSize} bytes`
                });
            }
        }

        // Validate origin
        const origin = event.headers?.origin || event.headers?.Origin;
        if (origin && !this.isOriginAllowed(origin)) {
            errors.push({
                type: 'invalid_origin',
                message: `Origin ${origin} is not allowed`
            });
        }

        // Validate HTTP method
        const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
        if (!allowedMethods.includes(event.httpMethod)) {
            errors.push({
                type: 'invalid_method',
                message: `HTTP method ${event.httpMethod} is not allowed`
            });
        }

        return errors;
    }

    isOriginAllowed(origin) {
        if (this.allowedOrigins.includes('*')) {
            return true;
        }

        return this.allowedOrigins.some(allowedOrigin => {
            if (allowedOrigin === origin) {
                return true;
            }
            
            // Support wildcard subdomains
            if (allowedOrigin.startsWith('*.')) {
                const domain = allowedOrigin.substring(2);
                return origin.endsWith(`.${domain}`) || origin === domain;
            }
            
            return false;
        });
    }

    addSecurityHeaders(response) {
        if (!this.enableSecurityHeaders) {
            return response;
        }

        if (!response.headers) {
            response.headers = {};
        }

        // CORS headers
        response.headers['Access-Control-Allow-Origin'] = '*';
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';

        // Security headers
        response.headers['X-Content-Type-Options'] = 'nosniff';
        response.headers['X-Frame-Options'] = 'DENY';
        response.headers['X-XSS-Protection'] = '1; mode=block';
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
        response.headers['Content-Security-Policy'] = "default-src 'none'";
        
        // Cache control for sensitive endpoints
        if (response.statusCode >= 400) {
            response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate';
            response.headers['Pragma'] = 'no-cache';
        }

        return response;
    }

    async logSecurityEvent(event, eventType, severity, message, metadata = {}) {
        if (!this.enableSecurityLogging) {
            return;
        }

        const securityEvent = {
            timestamp: new Date().toISOString(),
            type: eventType,
            severity,
            message,
            ip: this.getClientIP(event),
            userAgent: event.headers?.['user-agent'] || event.headers?.['User-Agent'] || 'unknown',
            endpoint: event.path || event.resource,
            method: event.httpMethod,
            requestId: event.requestContext?.requestId,
            metadata
        };

        // Log to console for immediate visibility
        console.warn('Security Event:', securityEvent);

        // Send to CloudWatch Logs (async, don't wait)
        this.sendToCloudWatch(securityEvent).catch(error => {
            console.error('Failed to send security event to CloudWatch:', error);
        });
    }

    async sendToCloudWatch(securityEvent) {
        try {
            const logEvents = [{
                timestamp: Date.now(),
                message: JSON.stringify(securityEvent)
            }];

            await cloudwatch.putLogEvents({
                logGroupName: LOG_GROUP_NAME,
                logStreamName: `security-events-${new Date().toISOString().split('T')[0]}`,
                logEvents
            }).promise();
        } catch (error) {
            // If log group doesn't exist, try to create it
            if (error.code === 'ResourceNotFoundException') {
                try {
                    await cloudwatch.createLogGroup({
                        logGroupName: LOG_GROUP_NAME
                    }).promise();
                    
                    // Retry sending the event
                    await this.sendToCloudWatch(securityEvent);
                } catch (createError) {
                    console.error('Failed to create CloudWatch log group:', createError);
                }
            } else {
                throw error;
            }
        }
    }

    getClientIP(event) {
        const forwardedFor = event.headers?.['x-forwarded-for'] || event.headers?.['X-Forwarded-For'];
        const realIp = event.headers?.['x-real-ip'] || event.headers?.['X-Real-IP'];
        const sourceIp = event.requestContext?.identity?.sourceIp;
        
        if (forwardedFor) {
            return forwardedFor.split(',')[0].trim();
        }
        
        return realIp || sourceIp || 'unknown';
    }

    createSecurityErrorResponse(errors) {
        const primaryError = errors[0];
        let statusCode = 400;

        if (primaryError.type === 'request_too_large') {
            statusCode = 413;
        } else if (primaryError.type === 'invalid_origin') {
            statusCode = 403;
        } else if (primaryError.type === 'invalid_method') {
            statusCode = 405;
        }

        const response = {
            statusCode,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: 'Security validation failed',
                message: primaryError.message,
                type: primaryError.type,
                timestamp: new Date().toISOString()
            })
        };

        return this.addSecurityHeaders(response);
    }
}

// Input sanitization utilities for Lambda
class LambdaInputSanitizer {
    static sanitizeText(input, maxLength = 10000) {
        if (!input || typeof input !== 'string') {
            throw new Error('Invalid input: must be a non-empty string');
        }

        if (input.length > maxLength) {
            throw new Error(`Input too long: maximum ${maxLength} characters allowed`);
        }

        // Remove null bytes and control characters
        let sanitized = input.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

        // HTML encode dangerous characters
        sanitized = sanitized
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');

        return sanitized.trim();
    }

    static validateJSON(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            
            // Check for prototype pollution attempts
            if (this.hasPrototypePollution(parsed)) {
                throw new Error('Potential prototype pollution detected');
            }
            
            return parsed;
        } catch (error) {
            throw new Error(`Invalid JSON: ${error.message}`);
        }
    }

    static hasPrototypePollution(obj) {
        const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
        
        function checkObject(obj) {
            if (obj === null || typeof obj !== 'object') {
                return false;
            }
            
            for (const key of Object.keys(obj)) {
                if (dangerousKeys.includes(key)) {
                    return true;
                }
                
                if (typeof obj[key] === 'object' && checkObject(obj[key])) {
                    return true;
                }
            }
            
            return false;
        }
        
        return checkObject(obj);
    }

    static detectSQLInjection(input) {
        const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
            /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
            /(--|\/\*|\*\/|;)/,
            /(\b(CHAR|NCHAR|VARCHAR|NVARCHAR)\s*\()/i,
            /(\b(WAITFOR|DELAY)\b)/i,
        ];

        return sqlPatterns.some(pattern => pattern.test(input));
    }

    static detectXSS(input) {
        const xssPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<iframe[^>]*>.*?<\/iframe>/gi,
            /<object[^>]*>.*?<\/object>/gi,
            /<embed[^>]*>/gi,
            /expression\s*\(/gi,
            /vbscript:/gi,
        ];

        return xssPatterns.some(pattern => pattern.test(input));
    }
}

// Middleware wrapper for Lambda functions
function withSecurity(securityMiddleware, handler) {
    return async (event, context) => {
        try {
            // Handle preflight requests
            if (event.httpMethod === 'OPTIONS') {
                const response = {
                    statusCode: 200,
                    headers: {},
                    body: ''
                };
                return securityMiddleware.addSecurityHeaders(response);
            }

            // Validate request
            const validationErrors = await securityMiddleware.validateRequest(event);
            
            if (validationErrors.length > 0) {
                // Log security event
                await securityMiddleware.logSecurityEvent(
                    event,
                    'blocked_request',
                    'medium',
                    `Request blocked: ${validationErrors.map(e => e.message).join(', ')}`,
                    { errors: validationErrors }
                );
                
                return securityMiddleware.createSecurityErrorResponse(validationErrors);
            }

            // Execute the original handler
            const response = await handler(event, context);
            
            // Add security headers to response
            return securityMiddleware.addSecurityHeaders(response);
            
        } catch (error) {
            console.error('Security middleware error:', error);
            
            // Log security event
            await securityMiddleware.logSecurityEvent(
                event,
                'suspicious_activity',
                'high',
                `Security middleware error: ${error.message}`,
                { error: error.stack }
            );
            
            // Return generic error response
            const response = {
                statusCode: 500,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    error: 'Internal server error',
                    message: 'An unexpected error occurred',
                    timestamp: new Date().toISOString()
                })
            };
            
            return securityMiddleware.addSecurityHeaders(response);
        }
    };
}

// Pre-configured security middleware
const defaultSecurityMiddleware = new LambdaSecurityMiddleware({
    maxRequestSize: 10 * 1024 * 1024, // 10MB
    allowedOrigins: process.env.NODE_ENV === 'production' 
        ? [process.env.ALLOWED_ORIGIN || 'https://scam-hunt.vercel.app']
        : ['*'],
    enableSecurityHeaders: true,
    enableInputValidation: true,
    enableSecurityLogging: true
});

module.exports = {
    LambdaSecurityMiddleware,
    LambdaInputSanitizer,
    withSecurity,
    defaultSecurityMiddleware
};