import { NextRequest, NextResponse } from 'next/server';
import { withMiddleware, urlInspectorMiddleware, getClientIP } from '@/lib/middleware';
import { InputSanitizer, SecurityLogger } from '@/lib/middleware/security';

interface URLInspectionRequest {
  url: string;
}

interface URLInspectionResult {
  url: string;
  domain: string;
  protocol: string;
  title: string;
  contentLength: number;
  hasSSL: boolean;
  suspiciousPatterns: Array<{
    type: string;
    keyword?: string;
    description?: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  timestamp: string;
}

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url }: URLInspectionRequest = body;

    if (!url) {
      const ip = getClientIP(request);
      SecurityLogger.logEvent({
        type: 'invalid_input',
        severity: 'low',
        message: 'Missing URL parameter in URL inspection request',
        ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        endpoint: '/api/url-inspector',
      });

      return NextResponse.json(
        {
          success: false,
          error: 'URL is required'
        },
        { status: 400 }
      );
    }

    // Sanitize URL input
    let sanitizedUrl: string;
    try {
      sanitizedUrl = InputSanitizer.sanitizeText(url, 2048);
    } catch (sanitizeError) {
      const ip = getClientIP(request);
      SecurityLogger.logEvent({
        type: 'invalid_input',
        severity: 'medium',
        message: `Invalid URL input: ${sanitizeError instanceof Error ? sanitizeError.message : 'Unknown error'}`,
        ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        endpoint: '/api/url-inspector',
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid URL input',
          message: sanitizeError instanceof Error ? sanitizeError.message : 'Unknown error'
        },
        { status: 400 }
      );
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(sanitizedUrl);
    } catch (error) {
      const ip = getClientIP(request);
      SecurityLogger.logEvent({
        type: 'invalid_input',
        severity: 'medium',
        message: `Invalid URL format: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        endpoint: '/api/url-inspector',
        metadata: { url: sanitizedUrl.substring(0, 100) }
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid URL format'
        },
        { status: 400 }
      );
    }

    // Security check - only allow HTTP/HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      const ip = getClientIP(request);
      SecurityLogger.logEvent({
        type: 'blocked_request',
        severity: 'high',
        message: `Blocked non-HTTP(S) URL: ${parsedUrl.protocol}`,
        ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        endpoint: '/api/url-inspector',
        metadata: { url: sanitizedUrl.substring(0, 100) }
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Only HTTP and HTTPS URLs are allowed'
        },
        { status: 400 }
      );
    }

    // Call AWS Lambda URL inspector function
    const lambdaUrl = process.env.AWS_URL_INSPECTOR_ENDPOINT;
    if (!lambdaUrl) {
      console.error('AWS_URL_INSPECTOR_ENDPOINT not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'URL inspection service not available'
        },
        { status: 503 }
      );
    }

    const lambdaResponse = await fetch(lambdaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: sanitizedUrl }),
    });

    if (!lambdaResponse.ok) {
      throw new Error(`Lambda function returned ${lambdaResponse.status}: ${lambdaResponse.statusText}`);
    }

    const result: URLInspectionResult = await lambdaResponse.json();

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('URL inspection failed:', error);

    // Log security event
    const ip = getClientIP(request);
    SecurityLogger.logEvent({
      type: 'suspicious_activity',
      severity: 'medium',
      message: `URL inspection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
      endpoint: '/api/url-inspector',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'URL inspection failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Export middleware-wrapped handler
export const POST = withMiddleware(handlePOST, urlInspectorMiddleware);