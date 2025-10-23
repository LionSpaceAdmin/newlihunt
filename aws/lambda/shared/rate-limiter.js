const AWS = require('aws-sdk');

// DynamoDB table for rate limiting (create if not exists)
const dynamodb = new AWS.DynamoDB.DocumentClient();
const RATE_LIMIT_TABLE = process.env.RATE_LIMIT_TABLE || 'scam-hunt-rate-limits';

class LambdaRateLimiter {
    constructor(config = {}) {
        this.windowMs = config.windowMs || 60000; // 1 minute default
        this.maxRequests = config.maxRequests || 10;
        this.keyPrefix = config.keyPrefix || 'default';
        this.useMemoryFallback = config.useMemoryFallback !== false;
        
        // In-memory fallback store
        this.memoryStore = new Map();
        
        // Cleanup memory store periodically
        if (this.useMemoryFallback) {
            setInterval(() => this.cleanupMemoryStore(), 60000);
        }
    }

    generateKey(event) {
        // Extract client identifier
        const ip = this.getClientIP(event);
        const userAgent = event.headers?.['user-agent'] || event.headers?.['User-Agent'] || '';
        const userAgentHash = this.simpleHash(userAgent);
        
        return `${this.keyPrefix}:${ip}:${userAgentHash}`;
    }

    getClientIP(event) {
        // Try various headers for client IP
        const forwardedFor = event.headers?.['x-forwarded-for'] || event.headers?.['X-Forwarded-For'];
        const realIp = event.headers?.['x-real-ip'] || event.headers?.['X-Real-IP'];
        const sourceIp = event.requestContext?.identity?.sourceIp;
        
        if (forwardedFor) {
            return forwardedFor.split(',')[0].trim();
        }
        
        return realIp || sourceIp || 'unknown';
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16).substring(0, 8);
    }

    async checkRateLimit(event) {
        const key = this.generateKey(event);
        const now = Date.now();
        const windowStart = now - this.windowMs;

        try {
            // Try DynamoDB first
            const result = await this.checkDynamoDBRateLimit(key, now, windowStart);
            return result;
        } catch (error) {
            console.warn('DynamoDB rate limit check failed, using memory fallback:', error.message);
            
            if (this.useMemoryFallback) {
                return this.checkMemoryRateLimit(key, now, windowStart);
            }
            
            // If no fallback, allow the request but log the error
            console.error('Rate limiting unavailable:', error);
            return {
                allowed: true,
                limit: this.maxRequests,
                remaining: this.maxRequests,
                resetTime: now + this.windowMs,
                fallback: true
            };
        }
    }

    async checkDynamoDBRateLimit(key, now, windowStart) {
        const ttl = Math.floor((now + this.windowMs) / 1000); // TTL in seconds

        try {
            // Get current count
            const getResult = await dynamodb.get({
                TableName: RATE_LIMIT_TABLE,
                Key: { id: key }
            }).promise();

            let currentCount = 0;
            let resetTime = now + this.windowMs;

            if (getResult.Item) {
                const itemTime = getResult.Item.timestamp || 0;
                if (itemTime > windowStart) {
                    currentCount = getResult.Item.count || 0;
                    resetTime = getResult.Item.resetTime || resetTime;
                }
            }

            const allowed = currentCount < this.maxRequests;
            const newCount = allowed ? currentCount + 1 : currentCount;

            if (allowed) {
                // Update count
                await dynamodb.put({
                    TableName: RATE_LIMIT_TABLE,
                    Item: {
                        id: key,
                        count: newCount,
                        timestamp: now,
                        resetTime: resetTime,
                        ttl: ttl
                    }
                }).promise();
            }

            return {
                allowed,
                limit: this.maxRequests,
                remaining: Math.max(0, this.maxRequests - newCount),
                resetTime,
                retryAfter: allowed ? undefined : Math.ceil((resetTime - now) / 1000)
            };

        } catch (error) {
            throw new Error(`DynamoDB operation failed: ${error.message}`);
        }
    }

    checkMemoryRateLimit(key, now, windowStart) {
        let entry = this.memoryStore.get(key);

        // Initialize or reset if window has passed
        if (!entry || entry.resetTime < now) {
            entry = {
                count: 0,
                resetTime: now + this.windowMs
            };
            this.memoryStore.set(key, entry);
        }

        const allowed = entry.count < this.maxRequests;
        const remaining = Math.max(0, this.maxRequests - entry.count);
        const retryAfter = allowed ? undefined : Math.ceil((entry.resetTime - now) / 1000);

        // Increment count if request is allowed
        if (allowed) {
            entry.count++;
        }

        return {
            allowed,
            limit: this.maxRequests,
            remaining,
            resetTime: entry.resetTime,
            retryAfter,
            fallback: true
        };
    }

    cleanupMemoryStore() {
        const now = Date.now();
        for (const [key, entry] of this.memoryStore.entries()) {
            if (entry.resetTime < now) {
                this.memoryStore.delete(key);
            }
        }
    }

    createRateLimitResponse(result) {
        const headers = {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Content-Type': 'application/json'
        };

        if (result.retryAfter) {
            headers['Retry-After'] = result.retryAfter.toString();
        }

        if (result.fallback) {
            headers['X-RateLimit-Fallback'] = 'true';
        }

        return {
            statusCode: 429,
            headers,
            body: JSON.stringify({
                error: 'Rate limit exceeded',
                message: 'Too many requests, please try again later.',
                retryAfter: result.retryAfter,
                limit: result.limit,
                remaining: result.remaining
            })
        };
    }

    addRateLimitHeaders(response, result) {
        if (!response.headers) {
            response.headers = {};
        }

        response.headers['X-RateLimit-Limit'] = result.limit.toString();
        response.headers['X-RateLimit-Remaining'] = result.remaining.toString();
        response.headers['X-RateLimit-Reset'] = result.resetTime.toString();

        if (result.fallback) {
            response.headers['X-RateLimit-Fallback'] = 'true';
        }

        return response;
    }
}

// Pre-configured rate limiters
const analysisRateLimiter = new LambdaRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    keyPrefix: 'analysis'
});

const uploadRateLimiter = new LambdaRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    keyPrefix: 'upload'
});

const urlInspectorRateLimiter = new LambdaRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    keyPrefix: 'url-inspector'
});

// Middleware wrapper for Lambda functions
function withRateLimit(rateLimiter, handler) {
    return async (event, context) => {
        try {
            // Check rate limit
            const rateLimitResult = await rateLimiter.checkRateLimit(event);
            
            if (!rateLimitResult.allowed) {
                console.log('Rate limit exceeded:', {
                    key: rateLimiter.generateKey(event),
                    limit: rateLimitResult.limit,
                    remaining: rateLimitResult.remaining,
                    retryAfter: rateLimitResult.retryAfter
                });
                
                return rateLimiter.createRateLimitResponse(rateLimitResult);
            }

            // Execute the original handler
            const response = await handler(event, context);
            
            // Add rate limit headers to successful responses
            return rateLimiter.addRateLimitHeaders(response, rateLimitResult);
            
        } catch (error) {
            console.error('Rate limiter error:', error);
            
            // If rate limiting fails, allow the request but log the error
            const response = await handler(event, context);
            return response;
        }
    };
}

module.exports = {
    LambdaRateLimiter,
    analysisRateLimiter,
    uploadRateLimiter,
    urlInspectorRateLimiter,
    withRateLimit
};