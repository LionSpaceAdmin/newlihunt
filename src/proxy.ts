import { NextRequest, NextResponse } from 'next/server';
import { defaultSecurityMiddleware } from '@/lib/middleware/security';

export function proxy(request: NextRequest) {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    );
    response.headers.set('Access-Control-Max-Age', '86400');

    return defaultSecurityMiddleware.addSecurityHeaders(response);
  }

  // Create response
  const response = NextResponse.next();

  // Add comprehensive security headers
  const secureResponse = defaultSecurityMiddleware.addSecurityHeaders(response);

  // Add additional security headers specific to the application
  secureResponse.headers.set('X-DNS-Prefetch-Control', 'off');
  secureResponse.headers.set('X-Download-Options', 'noopen');
  secureResponse.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

  // Strict Transport Security (only in production with HTTPS)
  if (process.env.NODE_ENV === 'production') {
    secureResponse.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Content Security Policy
  const csp = buildContentSecurityPolicy();
  secureResponse.headers.set('Content-Security-Policy', csp);

  // Permissions Policy
  const permissionsPolicy = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
    'ambient-light-sensor=()',
    'autoplay=()',
    'encrypted-media=()',
    'fullscreen=(self)',
    'picture-in-picture=()',
  ].join(', ');
  secureResponse.headers.set('Permissions-Policy', permissionsPolicy);

  return secureResponse;
}

function buildContentSecurityPolicy(): string {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const directives = [
    "default-src 'self'",

    // Scripts: Allow self, inline scripts for Next.js, and Vercel analytics
    isDevelopment
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://cdnjs.buymeacoffee.com"
      : "script-src 'self' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com https://cdnjs.buymeacoffee.com",

    // Styles: Allow self, inline styles, and Google Fonts
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

    // Fonts: Allow self and Google Fonts
    "font-src 'self' https://fonts.gstatic.com data:",

    // Images: Allow self, data URLs, HTTPS, and blob URLs for uploads
    "img-src 'self' data: https: blob:",

    // Media: Allow self, data URLs, and HTTPS
    "media-src 'self' data: https:",

    // Connect: Allow self, HTTPS, and WebSocket connections
    isDevelopment
      ? "connect-src 'self' https: wss: ws: http://localhost:*"
      : "connect-src 'self' https: wss:",

    // Frames: Deny all frames
    "frame-src 'none'",

    // Objects: Deny all objects
    "object-src 'none'",

    // Base URI: Restrict to self
    "base-uri 'self'",

    // Form actions: Restrict to self
    "form-action 'self'",

    // Frame ancestors: Deny all
    "frame-ancestors 'none'",

    // Upgrade insecure requests in production
    ...(isDevelopment ? [] : ['upgrade-insecure-requests']),

    // Block mixed content
    'block-all-mixed-content',
  ];

  return directives.join('; ');
}

// Apply proxy to all routes except static files
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
