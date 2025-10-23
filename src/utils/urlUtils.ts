/**
 * URL utility functions for URL detection and inspection
 */

export interface URLInspectionResult {
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

export interface URLInspectionResponse {
  success: boolean;
  result?: URLInspectionResult;
  error?: string;
  message?: string;
}

/**
 * Detects URLs in text content
 */
export function detectURLs(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
  const matches = text.match(urlRegex);
  return matches || [];
}

/**
 * Validates if a string is a valid URL
 */
export function isValidURL(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

/**
 * Extracts domain from URL
 */
export function extractDomain(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch {
    return null;
  }
}

/**
 * Checks if a URL might be suspicious based on common patterns
 */
export function isLikelySuspiciousURL(url: string): boolean {
  const domain = extractDomain(url);
  if (!domain) return false;

  const suspiciousPatterns = [
    // Common spoofing patterns
    /paypal[^.]/i,
    /amazon[^.]/i,
    /google[^.]/i,
    /microsoft[^.]/i,
    /apple[^.]/i,
    // URL shorteners (could hide malicious links)
    /bit\.ly|tinyurl|t\.co|goo\.gl|short\.link/i,
    // Suspicious TLDs
    /\.(tk|ml|ga|cf)$/i,
    // IP addresses instead of domains
    /^\d+\.\d+\.\d+\.\d+/,
  ];

  return suspiciousPatterns.some(pattern => pattern.test(domain));
}

/**
 * Calls the URL inspection API
 */
export async function inspectURL(url: string): Promise<URLInspectionResponse> {
  try {
    const response = await fetch('/api/url-inspector', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'URL inspection failed',
        message: data.message,
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: 'Network error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Formats URL inspection results for display
 */
export function formatURLInspectionResult(result: URLInspectionResult): string {
  const { domain, title, hasSSL, suspiciousPatterns } = result;

  let summary = `🔍 **URL Analysis for ${domain}**\n\n`;

  if (title) {
    summary += `📄 **Page Title:** ${title}\n`;
  }

  summary += `🔒 **Security:** ${hasSSL ? 'HTTPS (Secure)' : 'HTTP (Not Secure)'}\n`;

  if (suspiciousPatterns.length > 0) {
    summary += `\n⚠️ **Suspicious Patterns Detected:**\n`;
    suspiciousPatterns.forEach(pattern => {
      const severityIcon =
        pattern.severity === 'high' ? '🚨' : pattern.severity === 'medium' ? '⚠️' : '⚡';
      summary += `${severityIcon} ${pattern.description || pattern.keyword || pattern.type}\n`;
    });
  } else {
    summary += `\n✅ **No obvious suspicious patterns detected**\n`;
  }

  summary += `\n*Analysis completed at ${new Date(result.timestamp).toLocaleString()}*`;

  return summary;
}

/**
 * Creates a safety warning message for suspicious URLs
 */
export function createURLSafetyWarning(url: string): string {
  const domain = extractDomain(url);
  return `⚠️ **URL Safety Warning**

I detected a potentially suspicious URL: **${domain}**

**Safety Recommendations:**
• Do not click the link directly
• Verify the sender's identity through other means
• Check if the domain matches the official website
• Look for spelling errors or unusual characters in the domain
• When in doubt, navigate to the official website manually

Would you like me to inspect this URL safely for you?`;
}
