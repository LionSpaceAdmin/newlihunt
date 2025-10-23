const https = require('https');
const http = require('http');
const { URL } = require('url');

const handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
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

    try {
        let requestBody;
        try {
            requestBody = LambdaInputSanitizer.validateJSON(event.body);
        } catch (parseError) {
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
                body: JSON.stringify({ error: 'Invalid JSON in request body' })
            };
        }
        
        const { url } = requestBody;
        
        if (!url) {
            await defaultSecurityMiddleware.logSecurityEvent(
                event,
                'invalid_input',
                'low',
                'Missing URL parameter',
                {}
            );
            
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'URL is required' })
            };
        }

        // Sanitize URL input
        const sanitizedUrl = LambdaInputSanitizer.sanitizeText(url, 2048);

        // Validate URL
        let parsedUrl;
        try {
            parsedUrl = new URL(sanitizedUrl);
        } catch (error) {
            await defaultSecurityMiddleware.logSecurityEvent(
                event,
                'invalid_input',
                'medium',
                `Invalid URL format: ${error.message}`,
                { url: sanitizedUrl.substring(0, 100) }
            );
            
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid URL format' })
            };
        }

        // Security check - only allow HTTP/HTTPS
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            await defaultSecurityMiddleware.logSecurityEvent(
                event,
                'blocked_request',
                'high',
                `Blocked non-HTTP(S) URL: ${parsedUrl.protocol}`,
                { url: sanitizedUrl.substring(0, 100) }
            );
            
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Only HTTP and HTTPS URLs are allowed' })
            };
        }

        // Fetch URL content safely
        const content = await fetchUrlContent(sanitizedUrl);
        
        // Basic analysis
        const analysis = {
            url: sanitizedUrl,
            domain: parsedUrl.hostname,
            protocol: parsedUrl.protocol,
            title: extractTitle(content),
            contentLength: content.length,
            hasSSL: parsedUrl.protocol === 'https:',
            suspiciousPatterns: detectSuspiciousPatterns(content, parsedUrl.hostname),
            timestamp: new Date().toISOString()
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(analysis)
        };

    } catch (error) {
        console.error('URL inspection error:', error);
        
        // Log security event for inspection errors
        await defaultSecurityMiddleware.logSecurityEvent(
            event,
            'suspicious_activity',
            'medium',
            `URL inspection error: ${error.message}`,
            { error: error.stack }
        );
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'URL inspection failed',
                message: error.message
            })
        };
    }
};

// Export handler directly
exports.handler = handler;

function fetchUrlContent(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https:') ? https : http;
        const timeout = 10000; // 10 seconds

        const req = client.get(url, {
            timeout: timeout,
            headers: {
                'User-Agent': 'ScamHunt-URLInspector/1.0'
            }
        }, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                return;
            }

            let data = '';
            res.on('data', chunk => {
                data += chunk;
                // Limit content size to prevent memory issues
                if (data.length > 1024 * 1024) { // 1MB limit
                    req.destroy();
                    reject(new Error('Content too large'));
                }
            });

            res.on('end', () => resolve(data));
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.on('error', reject);
    });
}

function extractTitle(html) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : '';
}

function detectSuspiciousPatterns(content, domain) {
    const patterns = [];
    
    // Check for common scam indicators
    const suspiciousKeywords = [
        'urgent donation', 'emergency fund', 'limited time', 'act now',
        'verify your account', 'suspended account', 'click here immediately'
    ];
    
    const lowerContent = content.toLowerCase();
    suspiciousKeywords.forEach(keyword => {
        if (lowerContent.includes(keyword)) {
            patterns.push({
                type: 'suspicious_keyword',
                keyword: keyword,
                severity: 'medium'
            });
        }
    });

    // Check for suspicious domain patterns
    if (domain.includes('paypal') && !domain.endsWith('paypal.com')) {
        patterns.push({
            type: 'domain_spoofing',
            description: 'Potential PayPal domain spoofing',
            severity: 'high'
        });
    }

    return patterns;
}