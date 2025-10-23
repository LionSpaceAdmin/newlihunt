import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  message?: string; // Custom error message
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: this.defaultKeyGenerator,
      message: 'Too many requests, please try again later.',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
    };
  }

  private defaultKeyGenerator(request: NextRequest): string {
    // Use IP address as default key
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
    
    // Include user agent for additional uniqueness
    const userAgent = request.headers.get('user-agent') || '';
    const userAgentHash = this.simpleHash(userAgent);
    
    return `${ip}:${userAgentHash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).substring(0, 8);
  }

  private getClientKey(request: NextRequest): string {
    return this.config.keyGenerator!(request);
  }

  public async checkRateLimit(request: NextRequest): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    const key = this.getClientKey(request);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    let entry = rateLimitStore.get(key);

    // Initialize or reset if window has passed
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
      };
      rateLimitStore.set(key, entry);
    }

    const allowed = entry.count < this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - entry.count);
    const retryAfter = allowed ? undefined : Math.ceil((entry.resetTime - now) / 1000);

    // Increment count if request is allowed
    if (allowed) {
      entry.count++;
    }

    return {
      allowed,
      limit: this.config.maxRequests,
      remaining,
      resetTime: entry.resetTime,
      retryAfter,
    };
  }

  public createMiddleware() {
    return async (request: NextRequest): Promise<NextResponse | null> => {
      const result = await this.checkRateLimit(request);

      if (!result.allowed) {
        const response = NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: this.config.message,
            retryAfter: result.retryAfter,
          },
          { status: 429 }
        );

        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', result.limit.toString());
        response.headers.set('X-RateLimit-Remaining', '0');
        response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
        response.headers.set('Retry-After', result.retryAfter!.toString());

        return response;
      }

      // Add rate limit headers to successful responses
      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Limit', result.limit.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', result.resetTime.toString());

      return null; // Allow request to continue
    };
  }
}

// Pre-configured rate limiters for different endpoints
export const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  message: 'Too many API requests. Please try again in 15 minutes.',
});

export const analysisRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 analysis requests per minute
  message: 'Too many analysis requests. Please wait before submitting another analysis.',
});

export const uploadRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5, // 5 uploads per minute
  message: 'Too many upload requests. Please wait before uploading another file.',
});

export const historyRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 history requests per minute
  message: 'Too many history requests. Please wait before making more requests.',
});

// Session-based rate limiter for authenticated users
export const sessionRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 200, // 200 requests per hour per session
  keyGenerator: (request: NextRequest) => {
    // Use session ID if available, fallback to IP
    const sessionId = request.cookies.get('session-id')?.value;
    if (sessionId) {
      return `session:${sessionId}`;
    }
    
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
    return `ip:${ip}`;
  },
  message: 'Session rate limit exceeded. Please wait before making more requests.',
});