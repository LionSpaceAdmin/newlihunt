import { NextRequest, NextResponse } from 'next/server';

export interface SecurityConfig {
  enableCSP?: boolean;
  enableHSTS?: boolean;
  enableXFrameOptions?: boolean;
  enableXContentTypeOptions?: boolean;
  enableReferrerPolicy?: boolean;
  enablePermissionsPolicy?: boolean;
  maxRequestSize?: number;
  allowedOrigins?: string[];
}

export class SecurityMiddleware {
  private config: SecurityConfig;

  constructor(config: SecurityConfig = {}) {
    this.config = {
      enableCSP: true,
      enableHSTS: true,
      enableXFrameOptions: true,
      enableXContentTypeOptions: true,
      enableReferrerPolicy: true,
      enablePermissionsPolicy: true,
      maxRequestSize: 10 * 1024 * 1024, // 10MB
      allowedOrigins: ['*'], // Configure based on environment
      ...config,
    };
  }

  public createMiddleware() {
    return async (request: NextRequest): Promise<NextResponse | null> => {
      // Check request size
      const contentLength = request.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > this.config.maxRequestSize!) {
        return NextResponse.json(
          {
            error: 'Request too large',
            message: `Request size exceeds maximum allowed size of ${this.config.maxRequestSize} bytes`,
          },
          { status: 413 }
        );
      }

      // Validate origin for CORS
      const origin = request.headers.get('origin');
      if (origin && !this.isOriginAllowed(origin)) {
        return NextResponse.json(
          {
            error: 'Origin not allowed',
            message: 'Request origin is not in the allowed list',
          },
          { status: 403 }
        );
      }

      // Continue with request
      return null;
    };
  }

  public addSecurityHeaders(response: NextResponse): NextResponse {
    if (this.config.enableCSP) {
      const csp = this.buildCSPHeader();
      response.headers.set('Content-Security-Policy', csp);
    }

    if (this.config.enableHSTS) {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    if (this.config.enableXFrameOptions) {
      response.headers.set('X-Frame-Options', 'DENY');
    }

    if (this.config.enableXContentTypeOptions) {
      response.headers.set('X-Content-Type-Options', 'nosniff');
    }

    if (this.config.enableReferrerPolicy) {
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    if (this.config.enablePermissionsPolicy) {
      response.headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), payment=()'
      );
    }

    // Additional security headers
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-DNS-Prefetch-Control', 'off');
    response.headers.set('X-Download-Options', 'noopen');
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

    return response;
  }

  private buildCSPHeader(): string {
    const directives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' data: https:",
      "connect-src 'self' https: wss: ws:",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests',
    ];

    return directives.join('; ');
  }

  private isOriginAllowed(origin: string): boolean {
    if (this.config.allowedOrigins!.includes('*')) {
      return true;
    }

    return this.config.allowedOrigins!.some(allowedOrigin => {
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
}

// Input sanitization utilities
export class InputSanitizer {
  public static sanitizeText(input: string, maxLength: number = 10000): string {
    if (!input || typeof input !== 'string') {
      throw new Error('Invalid input: must be a non-empty string');
    }

    // Basic length check
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

    // Trim whitespace
    sanitized = sanitized.trim();

    return sanitized;
  }

  public static sanitizeHTML(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Server-safe HTML sanitization
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/data:/gi, '') // Remove data: URLs
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  public static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  public static validateURL(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }

  public static sanitizeFilename(filename: string): string {
    if (!filename || typeof filename !== 'string') {
      return 'unknown';
    }

    // Remove path traversal attempts and dangerous characters
    return filename
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
      .replace(/^\.+/, '_')
      .replace(/\.+$/, '_')
      .substring(0, 255);
  }

  public static detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(--|\/\*|\*\/|;)/,
      /(\b(CHAR|NCHAR|VARCHAR|NVARCHAR)\s*\()/i,
      /(\b(WAITFOR|DELAY)\b)/i,
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  public static detectXSS(input: string): boolean {
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

// Security event logging
export interface SecurityEvent {
  type: 'rate_limit' | 'invalid_input' | 'suspicious_activity' | 'blocked_request';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  ip: string;
  userAgent: string;
  endpoint: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export class SecurityLogger {
  private static events: SecurityEvent[] = [];
  private static maxEvents = 1000;

  public static logEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    };

    this.events.push(securityEvent);

    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log to console for monitoring
    console.warn('Security Event:', {
      type: event.type,
      severity: event.severity,
      message: event.message,
      ip: event.ip,
      endpoint: event.endpoint,
      timestamp: securityEvent.timestamp.toISOString(),
    });

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(securityEvent);
    }
  }

  public static getEvents(limit: number = 100): SecurityEvent[] {
    return this.events.slice(-limit);
  }

  public static getEventsByType(type: SecurityEvent['type'], limit: number = 100): SecurityEvent[] {
    return this.events.filter(event => event.type === type).slice(-limit);
  }

  private static async sendToMonitoring(event: SecurityEvent): Promise<void> {
    // Implement monitoring service integration
    // This could be AWS CloudWatch, DataDog, etc.
    try {
      // Log the event for now
      console.log('Security event:', event);
      // Example: Send to CloudWatch Logs
      if (process.env.AWS_REGION) {
        // Implementation would go here
      }
    } catch (error) {
      console.error('Failed to send security event to monitoring:', error);
    }
  }
}

// Pre-configured security middleware
export const defaultSecurityMiddleware = new SecurityMiddleware({
  enableCSP: true,
  enableHSTS: process.env.NODE_ENV === 'production',
  maxRequestSize: 10 * 1024 * 1024, // 10MB
  allowedOrigins:
    process.env.NODE_ENV === 'production'
      ? [process.env.NEXT_PUBLIC_APP_URL || 'https://scam-hunt.vercel.app']
      : ['*'],
});
