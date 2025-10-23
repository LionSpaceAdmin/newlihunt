const GeminiClient = require('./gemini-client');
const { SAFE_DONATION_CHANNELS } = require('./risk-signals');
const { withRateLimit, analysisRateLimiter } = require('../shared/rate-limiter');
const { withSecurity, defaultSecurityMiddleware, LambdaInputSanitizer } = require('../shared/security');
const https = require('https');
const http = require('http');

// Enhanced input validation and sanitization
const validateAndSanitizeInput = (input) => {
    if (!input || typeof input !== 'string') {
        throw new Error('Invalid input: must be a non-empty string');
    }
    
    // Check for malicious patterns
    if (LambdaInputSanitizer.detectSQLInjection(input)) {
        throw new Error('Potential SQL injection detected');
    }
    
    if (LambdaInputSanitizer.detectXSS(input)) {
        throw new Error('Potential XSS attack detected');
    }
    
    // Use enhanced sanitization
    return LambdaInputSanitizer.sanitizeText(input, 10000);
};

// Fetch image from URL and convert to base64
const fetchImageAsBase64 = async (imageUrl) => {
    return new Promise((resolve, reject) => {
        const url = new URL(imageUrl);
        const client = url.protocol === 'https:' ? https : http;
        
        const request = client.get(imageUrl, (response) => {
            // Check response status
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to fetch image: HTTP ${response.statusCode}`));
                return;
            }
            
            // Check content type
            const contentType = response.headers['content-type'];
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowedTypes.some(type => contentType?.includes(type))) {
                reject(new Error(`Invalid image type: ${contentType}`));
                return;
            }
            
            // Check content length
            const contentLength = parseInt(response.headers['content-length'] || '0');
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (contentLength > maxSize) {
                reject(new Error(`Image too large: ${contentLength} bytes (max: ${maxSize})`));
                return;
            }
            
            const chunks = [];
            let totalSize = 0;
            
            response.on('data', (chunk) => {
                chunks.push(chunk);
                totalSize += chunk.length;
                
                // Check size during download
                if (totalSize > maxSize) {
                    request.destroy();
                    reject(new Error(`Image too large: ${totalSize} bytes (max: ${maxSize})`));
                    return;
                }
            });
            
            response.on('end', () => {
                try {
                    const buffer = Buffer.concat(chunks);
                    const base64 = buffer.toString('base64');
                    
                    resolve({
                        base64,
                        mimeType: contentType,
                        size: totalSize
                    });
                } catch (error) {
                    reject(new Error(`Failed to convert image to base64: ${error.message}`));
                }
            });
            
            response.on('error', (error) => {
                reject(new Error(`Image download error: ${error.message}`));
            });
        });
        
        request.on('error', (error) => {
            reject(new Error(`Request error: ${error.message}`));
        });
        
        // Set timeout
        request.setTimeout(30000, () => {
            request.destroy();
            reject(new Error('Image download timeout'));
        });
    });
};

const handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Validate HTTP method
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({
                error: 'Method not allowed',
                message: 'Only POST requests are supported'
            })
        };
    }

    try {
        // Validate API key
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY not configured');
        }

        // Parse and validate request body with enhanced security
        let requestBody;
        try {
            requestBody = LambdaInputSanitizer.validateJSON(event.body || '{}');
        } catch (parseError) {
            // Log security event
            await defaultSecurityMiddleware.logSecurityEvent(
                event,
                'invalid_input',
                'medium',
                `JSON parsing failed: ${parseError.message}`,
                { body: event.body?.substring(0, 200) }
            );
            
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Invalid JSON',
                    message: 'Request body must be valid JSON'
                })
            };
        }

        const { message, imageBase64, imageMimeType, imageUrl, conversationHistory } = requestBody;

        // Validate input
        if (!message && !imageBase64 && !imageUrl) {
            // Log security event
            await defaultSecurityMiddleware.logSecurityEvent(
                event,
                'invalid_input',
                'low',
                'Missing required input parameters',
                { hasMessage: !!message, hasImageBase64: !!imageBase64, hasImageUrl: !!imageUrl }
            );
            
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Missing input',
                    message: 'Either message text, image data, or image URL is required'
                })
            };
        }

        // Sanitize text input
        let sanitizedMessage = '';
        if (message) {
            try {
                sanitizedMessage = validateAndSanitizeInput(message);
            } catch (sanitizeError) {
                // Log security event for malicious input
                await defaultSecurityMiddleware.logSecurityEvent(
                    event,
                    'blocked_request',
                    'high',
                    `Malicious input detected: ${sanitizeError.message}`,
                    { message: message.substring(0, 200) }
                );
                
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'Invalid input',
                        message: sanitizeError.message
                    })
                };
            }
        }

        // Process image if provided
        let processedImageData = null;
        
        // Handle image URL (preferred method for S3 uploads)
        if (imageUrl) {
            try {
                console.log('Fetching image from URL:', imageUrl);
                const imageData = await fetchImageAsBase64(imageUrl);
                processedImageData = GeminiClient.processImageData(imageData.base64, imageData.mimeType);
                console.log('Image processed successfully:', {
                    mimeType: imageData.mimeType,
                    size: imageData.size
                });
            } catch (error) {
                console.error('Failed to process image URL:', error.message);
                
                // Log security event for image processing failures
                await defaultSecurityMiddleware.logSecurityEvent(
                    event,
                    'suspicious_activity',
                    'medium',
                    `Image processing failed: ${error.message}`,
                    { imageUrl: imageUrl?.substring(0, 100) }
                );
                
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'Image processing failed',
                        message: error.message
                    })
                };
            }
        }
        // Fallback to base64 data (for backward compatibility)
        else if (imageBase64 && imageMimeType) {
            processedImageData = GeminiClient.processImageData(imageBase64, imageMimeType);
        }

        // Initialize Gemini client
        const geminiClient = new GeminiClient(process.env.GEMINI_API_KEY);

        // Generate analysis using Gemini client
        const analysisResult = await geminiClient.generateAnalysis(sanitizedMessage, processedImageData);

        // Add metadata and safe donation info
        const result = {
            ...analysisResult,
            metadata: {
                timestamp: new Date().toISOString(),
                model: "gemini-2.5-pro",
                processingTime: Date.now() - (event.requestContext?.requestTimeEpoch || Date.now()),
                inputLength: sanitizedMessage.length,
                hasImage: !!processedImageData,
                version: "2.1.0"
            },
            safeDonationChannels: SAFE_DONATION_CHANNELS
        };

        // Log analysis metrics (for monitoring)
        console.log('Analysis completed:', {
            riskScore: analysisResult.analysisData.riskScore,
            classification: analysisResult.analysisData.classification,
            detectedRulesCount: analysisResult.analysisData.detectedRules.length,
            processingTime: result.metadata.processingTime,
            hasImage: !!processedImageData,
            inputLength: sanitizedMessage.length
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result)
        };

    } catch (error) {
        console.error('Analysis error:', {
            message: error.message,
            stack: error.stack,
            event: {
                httpMethod: event.httpMethod,
                path: event.path,
                headers: event.headers
            }
        });

        // Log security event for analysis errors
        await defaultSecurityMiddleware.logSecurityEvent(
            event,
            'suspicious_activity',
            'high',
            `Analysis error: ${error.message}`,
            { 
                error: error.stack,
                httpMethod: event.httpMethod,
                path: event.path
            }
        );

        // Determine error type and status code
        let statusCode = 500;
        let errorMessage = 'Internal server error';

        if (error.message.includes('Invalid input') || 
            error.message.includes('Missing input') ||
            error.message.includes('Invalid image') ||
            error.message.includes('Input too long') ||
            error.message.includes('SQL injection') ||
            error.message.includes('XSS attack')) {
            statusCode = 400;
            errorMessage = error.message;
        } else if (error.message.includes('API key') || 
                   error.message.includes('authentication')) {
            statusCode = 401;
            errorMessage = 'Authentication failed';
        } else if (error.message.includes('quota') || 
                   error.message.includes('rate limit')) {
            statusCode = 429;
            errorMessage = 'Rate limit exceeded';
        }

        return {
            statusCode,
            headers,
            body: JSON.stringify({
                error: 'Analysis failed',
                message: errorMessage,
                timestamp: new Date().toISOString()
            })
        };
    }
};

// Export handler with security and rate limiting middleware
exports.handler = withSecurity(
    defaultSecurityMiddleware,
    withRateLimit(analysisRateLimiter, handler)
);