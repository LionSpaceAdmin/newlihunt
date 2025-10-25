import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

// ... (interfaces remain the same)

export class RateLimiter {
  // ... (constructor and key generation remain the same)

  public async checkRateLimit(request: NextRequest): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    const key = this.getClientKey(request);
    const now = Date.now();

    let entry: RateLimitEntry | null = await kv.get(key);

    // Initialize or reset if window has passed
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
      };
    }

    const allowed = entry.count < this.config.maxRequests;
    const remaining = allowed ? this.config.maxRequests - (entry.count + 1) : 0;
    const retryAfter = allowed ? undefined : Math.ceil((entry.resetTime - now) / 1000);

    // Increment count and update store
    if (allowed) {
      entry.count++;
      await kv.set(key, entry, { ex: Math.ceil(this.config.windowMs / 1000) }); // Set with expiration
    }

    return {
      allowed,
      limit: this.config.maxRequests,
      remaining,
      resetTime: entry.resetTime,
      retryAfter,
    };
  }

  // ... (createMiddleware remains the same)
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
