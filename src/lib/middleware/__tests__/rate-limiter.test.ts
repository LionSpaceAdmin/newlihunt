import { RateLimiter } from '../rate-limiter';

// Mock NextRequest
const createMockRequest = (ip: string = '127.0.0.1', userAgent: string = 'test-agent') => {
  return {
    headers: {
      get: (name: string) => {
        const headers: Record<string, string> = {
          'x-forwarded-for': ip,
          'user-agent': userAgent,
        };
        return headers[name.toLowerCase()] || null;
      },
    },
    nextUrl: {
      pathname: '/api/test',
    },
  } as any;
};

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 5,
    });
  });

  afterEach(() => {
    // Clear the in-memory store
    (rateLimiter as any).memoryStore?.clear();
  });

  describe('Rate Limiting Logic', () => {
    it('should allow requests within the limit', async () => {
      const request = createMockRequest();
      
      for (let i = 0; i < 5; i++) {
        const result = await rateLimiter.checkRateLimit(request);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
        expect(result.limit).toBe(5);
      }
    });

    it('should block requests exceeding the limit', async () => {
      const request = createMockRequest();
      
      // Make 5 allowed requests
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkRateLimit(request);
      }
      
      // 6th request should be blocked
      const result = await rateLimiter.checkRateLimit(request);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should differentiate between different IPs', async () => {
      const request1 = createMockRequest('192.168.1.1');
      const request2 = createMockRequest('192.168.1.2');
      
      // Exhaust limit for first IP
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkRateLimit(request1);
      }
      
      // First IP should be blocked
      const result1 = await rateLimiter.checkRateLimit(request1);
      expect(result1.allowed).toBe(false);
      
      // Second IP should still be allowed
      const result2 = await rateLimiter.checkRateLimit(request2);
      expect(result2.allowed).toBe(true);
    });

    it('should reset after time window expires', async () => {
      const shortLimiter = new RateLimiter({
        windowMs: 100, // 100ms
        maxRequests: 2,
      });
      
      const request = createMockRequest();
      
      // Exhaust limit
      await shortLimiter.checkRateLimit(request);
      await shortLimiter.checkRateLimit(request);
      
      // Should be blocked
      let result = await shortLimiter.checkRateLimit(request);
      expect(result.allowed).toBe(false);
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be allowed again
      result = await shortLimiter.checkRateLimit(request);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Key Generation', () => {
    it('should generate different keys for different user agents', async () => {
      const request1 = createMockRequest('127.0.0.1', 'Mozilla/5.0');
      const request2 = createMockRequest('127.0.0.1', 'Chrome/91.0');
      
      // Exhaust limit for first user agent
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkRateLimit(request1);
      }
      
      // First user agent should be blocked
      const result1 = await rateLimiter.checkRateLimit(request1);
      expect(result1.allowed).toBe(false);
      
      // Second user agent should still be allowed
      const result2 = await rateLimiter.checkRateLimit(request2);
      expect(result2.allowed).toBe(true);
    });

    it('should handle missing headers gracefully', async () => {
      const url = 'http://localhost:3000/api/test';
      const request = new NextRequest(url);
      
      const result = await rateLimiter.checkRateLimit(request);
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(5);
    });
  });

  describe('Middleware Integration', () => {
    it('should create middleware that blocks requests', async () => {
      const middleware = rateLimiter.createMiddleware();
      const request = createMockRequest();
      
      // Exhaust limit
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkRateLimit(request);
      }
      
      // Middleware should return a response
      const response = await middleware(request);
      expect(response).not.toBeNull();
      expect(response?.status).toBe(429);
      
      const body = await response?.json();
      expect(body.error).toBe('Rate limit exceeded');
    });

    it('should add rate limit headers to responses', async () => {
      const middleware = rateLimiter.createMiddleware();
      const request = createMockRequest();
      
      // Should allow request and return null (continue)
      const response = await middleware(request);
      expect(response).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent requests correctly', async () => {
      const request = createMockRequest();
      
      // Make concurrent requests
      const promises = Array(10).fill(null).map(() => 
        rateLimiter.checkRateLimit(request)
      );
      
      const results = await Promise.all(promises);
      
      // Only 5 should be allowed
      const allowedCount = results.filter(r => r.allowed).length;
      const blockedCount = results.filter(r => !r.allowed).length;
      
      expect(allowedCount).toBe(5);
      expect(blockedCount).toBe(5);
    });

    it('should handle very high request rates', async () => {
      const highRateLimiter = new RateLimiter({
        windowMs: 1000,
        maxRequests: 1000,
      });
      
      const request = createMockRequest();
      
      // Make many requests quickly
      const promises = Array(1500).fill(null).map(() => 
        highRateLimiter.checkRateLimit(request)
      );
      
      const results = await Promise.all(promises);
      
      const allowedCount = results.filter(r => r.allowed).length;
      const blockedCount = results.filter(r => !r.allowed).length;
      
      expect(allowedCount).toBe(1000);
      expect(blockedCount).toBe(500);
    });
  });

  describe('Memory Management', () => {
    it('should clean up expired entries', async () => {
      const shortLimiter = new RateLimiter({
        windowMs: 50, // 50ms
        maxRequests: 1,
      });
      
      const request = createMockRequest();
      
      // Make a request
      await shortLimiter.checkRateLimit(request);
      
      // Check that entry exists
      const store = (shortLimiter as any).memoryStore;
      expect(store.size).toBe(1);
      
      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Trigger cleanup
      (shortLimiter as any).cleanupMemoryStore();
      
      // Entry should be cleaned up
      expect(store.size).toBe(0);
    });
  });
});