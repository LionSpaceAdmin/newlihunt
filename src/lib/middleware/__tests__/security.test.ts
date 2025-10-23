/* eslint-disable @typescript-eslint/no-explicit-any */
import { InputSanitizer, SecurityLogger, SecurityMiddleware } from '../security';

// Mock NextRequest
const createMockRequest = (
  body?: string,
  headers: Record<string, string> = {},
  method: string = 'POST'
) => {
  return {
    method,
    body,
    headers: {
      get: (name: string) => {
        const allHeaders = {
          'content-type': 'application/json',
          'content-length': body ? body.length.toString() : '0',
          ...headers,
        };
        return allHeaders[name.toLowerCase()] || null;
      },
    },
    nextUrl: {
      pathname: '/api/test',
    },
  } as any;
};

// Mock NextResponse
const createMockResponse = (data: any, status: number = 200) => {
  return {
    status,
    headers: new Map(),
    json: () => Promise.resolve(data),
  } as any;
};

describe('SecurityMiddleware', () => {
  let securityMiddleware: SecurityMiddleware;

  beforeEach(() => {
    securityMiddleware = new SecurityMiddleware({
      maxRequestSize: 1024, // 1KB for testing
      allowedOrigins: ['http://localhost:3000', 'https://example.com'],
    });
  });

  describe('Request Validation', () => {
    it('should allow valid requests', async () => {
      const request = createMockRequest('{"test": "data"}');
      const middleware = securityMiddleware.createMiddleware();

      const response = await middleware(request);
      expect(response).toBeNull(); // Should allow request to continue
    });

    it('should block requests that are too large', async () => {
      const largeBody = 'x'.repeat(2048); // 2KB
      const request = createMockRequest(largeBody);
      const middleware = securityMiddleware.createMiddleware();

      const response = await middleware(request);
      expect(response).not.toBeNull();
      expect(response?.status).toBe(413);

      const body = await response?.json();
      expect(body.error).toBe('Request too large');
    });

    it('should block requests from disallowed origins', async () => {
      const request = createMockRequest('{"test": "data"}', {
        origin: 'https://malicious.com',
      });
      const middleware = securityMiddleware.createMiddleware();

      const response = await middleware(request);
      expect(response).not.toBeNull();
      expect(response?.status).toBe(403);

      const body = await response?.json();
      expect(body.error).toBe('Origin not allowed');
    });

    it('should allow wildcard origins when configured', async () => {
      const wildcardMiddleware = new SecurityMiddleware({
        allowedOrigins: ['*'],
      });

      const request = createMockRequest('{"test": "data"}', {
        origin: 'https://any-domain.com',
      });
      const middleware = wildcardMiddleware.createMiddleware();

      const response = await middleware(request);
      expect(response).toBeNull();
    });

    it('should support subdomain wildcards', async () => {
      const subdomainMiddleware = new SecurityMiddleware({
        allowedOrigins: ['*.example.com'],
      });

      const request = createMockRequest('{"test": "data"}', {
        origin: 'https://api.example.com',
      });
      const middleware = subdomainMiddleware.createMiddleware();

      const response = await middleware(request);
      expect(response).toBeNull();
    });
  });

  describe('Security Headers', () => {
    it('should add comprehensive security headers', () => {
      const response = createMockResponse({ success: true });
      const secureResponse = securityMiddleware.addSecurityHeaders(response);

      expect(secureResponse.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(secureResponse.headers.get('X-Frame-Options')).toBe('DENY');
      expect(secureResponse.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(secureResponse.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(secureResponse.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
    });

    it('should add HSTS header in production', () => {
      const prodMiddleware = new SecurityMiddleware({
        enableHSTS: true,
      });

      const response = createMockResponse({ success: true });
      const secureResponse = prodMiddleware.addSecurityHeaders(response);

      expect(secureResponse.headers.get('Strict-Transport-Security')).toBe(
        'max-age=31536000; includeSubDomains; preload'
      );
    });

    it('should build proper CSP header', () => {
      const response = createMockResponse({ success: true });
      const secureResponse = securityMiddleware.addSecurityHeaders(response);

      const csp = secureResponse.headers.get('Content-Security-Policy');
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("frame-src 'none'");
      expect(csp).toContain("object-src 'none'");
    });
  });
});

describe('InputSanitizer', () => {
  describe('Text Sanitization', () => {
    it('should sanitize basic HTML characters', () => {
      const input = '<script>alert("xss")</script>';
      const sanitized = InputSanitizer.sanitizeText(input);

      expect(sanitized).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    it('should remove null bytes and control characters', () => {
      const input = 'test\x00\x01\x02string';
      const sanitized = InputSanitizer.sanitizeText(input);

      expect(sanitized).toBe('teststring');
    });

    it('should enforce length limits', () => {
      const longInput = 'x'.repeat(100);

      expect(() => {
        InputSanitizer.sanitizeText(longInput, 50);
      }).toThrow('Input too long');
    });

    it('should handle empty and invalid inputs', () => {
      expect(() => {
        InputSanitizer.sanitizeText('');
      }).toThrow('Invalid input');

      expect(() => {
        InputSanitizer.sanitizeText(null as any);
      }).toThrow('Invalid input');
    });

    it('should trim whitespace', () => {
      const input = '  test string  ';
      const sanitized = InputSanitizer.sanitizeText(input);

      expect(sanitized).toBe('test string');
    });
  });

  describe('HTML Sanitization', () => {
    it('should remove all HTML tags', () => {
      const input = '<div>Hello <b>World</b></div>';
      const sanitized = InputSanitizer.sanitizeHTML(input);

      expect(sanitized).toBe('Hello World');
    });

    it('should handle malformed HTML', () => {
      const input = '<div>Unclosed tag<script>alert(1)';
      const sanitized = InputSanitizer.sanitizeHTML(input);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('<div>');
    });
  });

  describe('Validation Functions', () => {
    it('should validate email addresses', () => {
      expect(InputSanitizer.validateEmail('test@example.com')).toBe(true);
      expect(InputSanitizer.validateEmail('invalid-email')).toBe(false);
      expect(InputSanitizer.validateEmail('test@')).toBe(false);
      expect(InputSanitizer.validateEmail('@example.com')).toBe(false);
    });

    it('should validate URLs', () => {
      expect(InputSanitizer.validateURL('https://example.com')).toBe(true);
      expect(InputSanitizer.validateURL('http://example.com')).toBe(true);
      expect(InputSanitizer.validateURL('ftp://example.com')).toBe(false);
      expect(InputSanitizer.validateURL('javascript:alert(1)')).toBe(false);
      expect(InputSanitizer.validateURL('not-a-url')).toBe(false);
    });

    it('should sanitize filenames', () => {
      expect(InputSanitizer.sanitizeFilename('test.txt')).toBe('test.txt');
      expect(InputSanitizer.sanitizeFilename('../../etc/passwd')).toBe('___etc_passwd');
      expect(InputSanitizer.sanitizeFilename('file<>:"/\\|?*name.txt')).toBe(
        'file__________name.txt'
      );
      expect(InputSanitizer.sanitizeFilename('.hidden')).toBe('_hidden');
    });
  });

  describe('Attack Detection', () => {
    it('should detect SQL injection attempts', () => {
      const sqlInputs = [
        "'; DROP TABLE users; --",
        '1 OR 1=1',
        'UNION SELECT * FROM passwords',
        "admin'--",
        "1; WAITFOR DELAY '00:00:05'",
      ];

      sqlInputs.forEach(input => {
        expect(InputSanitizer.detectSQLInjection(input)).toBe(true);
      });

      expect(InputSanitizer.detectSQLInjection('normal text')).toBe(false);
    });

    it('should detect XSS attempts', () => {
      const xssInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert(1)',
        '<img onerror="alert(1)" src="x">',
        '<iframe src="javascript:alert(1)"></iframe>',
        'expression(alert(1))',
        'vbscript:msgbox(1)',
      ];

      xssInputs.forEach(input => {
        expect(InputSanitizer.detectXSS(input)).toBe(true);
      });

      expect(InputSanitizer.detectXSS('normal text')).toBe(false);
    });
  });
});

describe('SecurityLogger', () => {
  beforeEach(() => {
    // Clear events before each test
    (SecurityLogger as any).events = [];
  });

  it('should log security events', () => {
    SecurityLogger.logEvent({
      type: 'rate_limit',
      severity: 'medium',
      message: 'Rate limit exceeded',
      ip: '127.0.0.1',
      userAgent: 'test-agent',
      endpoint: '/api/test',
    });

    const events = SecurityLogger.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('rate_limit');
    expect(events[0].severity).toBe('medium');
  });

  it('should limit stored events', () => {
    // Add more events than the limit
    for (let i = 0; i < 1200; i++) {
      SecurityLogger.logEvent({
        type: 'suspicious_activity',
        severity: 'low',
        message: `Event ${i}`,
        ip: '127.0.0.1',
        userAgent: 'test-agent',
        endpoint: '/api/test',
      });
    }

    const events = SecurityLogger.getEvents();
    expect(events.length).toBeLessThanOrEqual(1000);
  });

  it('should filter events by type', () => {
    SecurityLogger.logEvent({
      type: 'rate_limit',
      severity: 'medium',
      message: 'Rate limit exceeded',
      ip: '127.0.0.1',
      userAgent: 'test-agent',
      endpoint: '/api/test',
    });

    SecurityLogger.logEvent({
      type: 'invalid_input',
      severity: 'high',
      message: 'Invalid input detected',
      ip: '127.0.0.1',
      userAgent: 'test-agent',
      endpoint: '/api/test',
    });

    const rateLimitEvents = SecurityLogger.getEventsByType('rate_limit');
    const invalidInputEvents = SecurityLogger.getEventsByType('invalid_input');

    expect(rateLimitEvents).toHaveLength(1);
    expect(invalidInputEvents).toHaveLength(1);
    expect(rateLimitEvents[0].type).toBe('rate_limit');
    expect(invalidInputEvents[0].type).toBe('invalid_input');
  });
});
