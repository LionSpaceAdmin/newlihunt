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

// Function to safely fetch and inspect URL
async function inspectURLDirectly(url: string): Promise<URLInspectionResult> {
  const parsedUrl = new URL(url);

  try {
    // Fetch URL content with timeout and size limits
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ScamHunter/1.0; URL Inspector)',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Limit content size to 1MB
    const contentLength = parseInt(response.headers.get('content-length') || '0');
    if (contentLength > 1024 * 1024) {
      throw new Error('Content too large');
    }

    const content = await response.text();

    // Extract title
    const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Detect suspicious patterns
    const suspiciousPatterns = detectSuspiciousPatterns(content, parsedUrl.hostname);

    return {
      url,
      domain: parsedUrl.hostname,
      protocol: parsedUrl.protocol,
      title,
      contentLength: content.length,
      hasSSL: parsedUrl.protocol === 'https:',
      suspiciousPatterns,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    // Return basic info even if fetch fails
    return {
      url,
      domain: parsedUrl.hostname,
      protocol: parsedUrl.protocol,
      title: '',
      contentLength: 0,
      hasSSL: parsedUrl.protocol === 'https:',
      suspiciousPatterns: [
        {
          type: 'fetch_error',
          description: `Failed to fetch content: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'medium' as const,
        },
      ],
      timestamp: new Date().toISOString(),
    };
  }
}

// Function to detect suspicious patterns in content
function detectSuspiciousPatterns(
  content: string,
  domain: string
): Array<{
  type: string;
  keyword?: string;
  description?: string;
  severity: 'low' | 'medium' | 'high';
}> {
  const patterns = [];
  const lowerContent = content.toLowerCase();

  // Urgent donation language
  const urgentWords = ['urgent', 'emergency', 'immediate', 'now', 'today only', 'limited time'];
  for (const word of urgentWords) {
    if (lowerContent.includes(word)) {
      patterns.push({
        type: 'urgent_language',
        keyword: word,
        description: 'Contains urgent language often used in scams',
        severity: 'medium' as const,
      });
      break;
    }
  }

  // Donation-related keywords
  const donationWords = ['donate', 'donation', 'contribute', 'support', 'help', 'fund'];
  for (const word of donationWords) {
    if (lowerContent.includes(word)) {
      patterns.push({
        type: 'donation_request',
        keyword: word,
        description: 'Contains donation-related content',
        severity: 'low' as const,
      });
      break;
    }
  }

  // Cryptocurrency mentions
  const cryptoWords = ['bitcoin', 'btc', 'ethereum', 'crypto', 'wallet', 'blockchain'];
  for (const word of cryptoWords) {
    if (lowerContent.includes(word)) {
      patterns.push({
        type: 'cryptocurrency',
        keyword: word,
        description: 'Mentions cryptocurrency',
        severity: 'medium' as const,
      });
      break;
    }
  }

  // Military/IDF related (could be legitimate or scam)
  const militaryWords = ['idf', 'israel defense', 'soldier', 'military', 'army', 'combat'];
  for (const word of militaryWords) {
    if (lowerContent.includes(word)) {
      patterns.push({
        type: 'military_content',
        keyword: word,
        description: 'Contains military-related content',
        severity: 'low' as const,
      });
      break;
    }
  }

  // Suspicious domain patterns
  if (domain.includes('bit.ly') || domain.includes('tinyurl') || domain.includes('t.co')) {
    patterns.push({
      type: 'shortened_url',
      description: 'Uses URL shortening service',
      severity: 'medium' as const,
    });
  }

  // Check for suspicious TLDs
  const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf'];
  for (const tld of suspiciousTlds) {
    if (domain.endsWith(tld)) {
      patterns.push({
        type: 'suspicious_tld',
        description: 'Uses potentially suspicious top-level domain',
        severity: 'high' as const,
      });
      break;
    }
  }

  return patterns;
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
          error: 'URL is required',
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
          message: sanitizeError instanceof Error ? sanitizeError.message : 'Unknown error',
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
        metadata: { url: sanitizedUrl.substring(0, 100) },
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid URL format',
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
        metadata: { url: sanitizedUrl.substring(0, 100) },
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Only HTTP and HTTPS URLs are allowed',
        },
        { status: 400 }
      );
    }

    // Inspect URL directly
    const result = await inspectURLDirectly(sanitizedUrl);

    return NextResponse.json({
      success: true,
      result,
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
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Export middleware-wrapped handler
export const POST = withMiddleware(handlePOST, urlInspectorMiddleware);
