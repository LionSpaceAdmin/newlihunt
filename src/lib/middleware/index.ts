import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter } from './rate-limiter';
import { SecurityMiddleware, SecurityLogger } from './security';

export type MiddlewareFunction = (request: NextRequest) => Promise<NextResponse | null>;

export class MiddlewareComposer {
  private middlewares: MiddlewareFunction[] = [];

  public use(middleware: MiddlewareFunction): this {
    this.middlewares.push(middleware);
    return this;
  }

  public async execute(request: NextRequest): Promise<NextResponse | null> {
    for (const middleware of this.middlewares) {
      const result = await middleware(request);
      if (result) {
        // Middleware returned a response, stop execution
        return result;
      }
    }
    return null; // All middlewares passed
  }
}

// Helper function to create API route middleware
export function withMiddleware(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  middlewares: MiddlewareFunction[] = []
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const composer = new MiddlewareComposer();
    
    // Add provided middlewares
    middlewares.forEach(middleware => composer.use(middleware));

    // Execute middlewares
    const middlewareResult = await composer.execute(request);
    if (middlewareResult) {
      return middlewareResult;
    }

    // Execute the actual handler
    try {
      const response = await handler(request, ...args);
      
      // Add security headers to response
      const securityMiddleware = new SecurityMiddleware();
      return securityMiddleware.addSecurityHeaders(response);
    } catch (error) {
      console.error('API handler error:', error);
      
      // Log security event for errors
      const ip = getClientIP(request);
      SecurityLogger.logEvent({
        type: 'suspicious_activity',
        severity: 'medium',
        message: `API handler error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        endpoint: request.nextUrl.pathname,
        metadata: { error: error instanceof Error ? error.stack : String(error) },
      });

      return NextResponse.json(
        {
          error: 'Internal server error',
          message: 'An unexpected error occurred',
        },
        { status: 500 }
      );
    }
  };
}

// Helper function to get client IP
export function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
  return ip.trim();
}

// Helper function to create rate-limited middleware
export function createRateLimitedMiddleware(rateLimiter: RateLimiter): MiddlewareFunction {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const result = await rateLimiter.checkRateLimit(request);
    
    if (!result.allowed) {
      const ip = getClientIP(request);
      
      // Log rate limit event
      SecurityLogger.logEvent({
        type: 'rate_limit',
        severity: 'medium',
        message: `Rate limit exceeded: ${result.limit} requests per window`,
        ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        endpoint: request.nextUrl.pathname,
        metadata: {
          limit: result.limit,
          remaining: result.remaining,
          retryAfter: result.retryAfter,
        },
      });

      const response = NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many requests, please try again later.',
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

    return null; // Allow request to continue
  };
}

// Helper function to create security middleware
export function createSecurityMiddleware(config?: any): MiddlewareFunction {
  const securityMiddleware = new SecurityMiddleware(config);
  return securityMiddleware.createMiddleware();
}

// Pre-configured middleware combinations
export const apiMiddleware = [
  createSecurityMiddleware(),
  createRateLimitedMiddleware(new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many API requests. Please try again in 15 minutes.',
  })),
];

export const analysisMiddleware = [
  createSecurityMiddleware(),
  createRateLimitedMiddleware(new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many analysis requests. Please wait before submitting another analysis.',
  })),
];

export const uploadMiddleware = [
  createSecurityMiddleware({
    maxRequestSize: 10 * 1024 * 1024, // 10MB for file uploads
  }),
  createRateLimitedMiddleware(new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'Too many upload requests. Please wait before uploading another file.',
  })),
];

export const historyMiddleware = [
  createSecurityMiddleware(),
  createRateLimitedMiddleware(new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Too many history requests. Please wait before making more requests.',
  })),
];

export const urlInspectorMiddleware = [
  createSecurityMiddleware(),
  createRateLimitedMiddleware(new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    message: 'Too many URL inspection requests. Please wait before inspecting another URL.',
  })),
];

// Export all middleware components
export * from './rate-limiter';
export * from './security';