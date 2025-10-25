import { kv } from '@vercel/kv';
import { NextRequest } from 'next/server';

interface RateLimiterConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
  keyGenerator?: (request: NextRequest) => string;
}

export class RateLimiter {
  private config: RateLimiterConfig;

  constructor(config: RateLimiterConfig) {
    this.config = config;
  }

  private getClientKey(request: NextRequest): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(request);
    }
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
    return `ip:${ip.trim()}`;
  }

  private async checkRateLimitWithKV(key: string): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const kvKey = `ratelimit:${key}`;

    try {
      // Remove old entries outside the sliding window
      await kv.zremrangebyscore(kvKey, 0, windowStart);

      // Count requests in current window
      const count = await kv.zcard(kvKey);

      const allowed = count < this.config.maxRequests;
      const remaining = allowed ? this.config.maxRequests - (count + 1) : 0;

      if (allowed) {
        // Add current request timestamp to sorted set
        await kv.zadd(kvKey, { score: now, member: `${now}-${Math.random()}` });
        
        // Set expiration to window duration (in seconds)
        await kv.expire(kvKey, Math.ceil(this.config.windowMs / 1000));
      }

      // Calculate reset time (end of current window)
      const oldestTimestamp = await kv.zrange(kvKey, 0, 0, { withScores: true });
      const resetTime = oldestTimestamp.length > 0 
        ? (oldestTimestamp[1] as number) + this.config.windowMs
        : now + this.config.windowMs;

      const retryAfter = allowed ? undefined : Math.ceil((resetTime - now) / 1000);

      return {
        allowed,
        limit: this.config.maxRequests,
        remaining,
        resetTime,
        retryAfter,
      };
    } catch (error) {
      // Fail-open: if KV is unavailable, allow the request
      console.error('Rate limiter KV error, failing open:', error);
      return {
        allowed: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs,
      };
    }
  }

  public async checkRateLimit(request: NextRequest): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    const key = this.getClientKey(request);
    return this.checkRateLimitWithKV(key);
  }
}

// Pre-configured rate limiters
export const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
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
