import { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimiterConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
  keyGenerator?: (request: NextRequest) => string;
}

export class RateLimiter {
  private config: RateLimiterConfig;
  private entries: Map<string, RateLimitEntry> = new Map();

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

  public async checkRateLimit(request: NextRequest): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    const key = this.getClientKey(request);
    const now = Date.now();

    let entry = this.entries.get(key);

    // Initialize or reset if window has passed
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
      };
      this.entries.set(key, entry);
    }

    const allowed = entry.count < this.config.maxRequests;
    const remaining = allowed ? this.config.maxRequests - (entry.count + 1) : 0;
    const retryAfter = allowed ? undefined : Math.ceil((entry.resetTime - now) / 1000);

    // Increment count
    if (allowed) {
      entry.count++;
    }

    // Clean up old entries periodically
    if (this.entries.size > 1000) {
      for (const [k, v] of this.entries) {
        if (v.resetTime < now) {
          this.entries.delete(k);
        }
      }
    }

    return {
      allowed,
      limit: this.config.maxRequests,
      remaining,
      resetTime: entry.resetTime,
      retryAfter,
    };
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
