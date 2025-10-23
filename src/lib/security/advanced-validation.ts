/* eslint-disable @typescript-eslint/no-explicit-any */
import { SecurityLogger } from '@/lib/middleware/security';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitized?: string;
}

export interface ValidationOptions {
  maxLength?: number;
  allowHTML?: boolean;
  allowURLs?: boolean;
  allowEmails?: boolean;
  checkForMaliciousPatterns?: boolean;
  customPatterns?: RegExp[];
}

export class AdvancedInputValidator {
  private static readonly MALICIOUS_PATTERNS = [
    // SQL Injection patterns
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(--|\/\*|\*\/|;)/,
    /(\b(CHAR|NCHAR|VARCHAR|NVARCHAR)\s*\()/i,
    /(\b(WAITFOR|DELAY)\b)/i,

    // XSS patterns
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>/gi,
    /expression\s*\(/gi,
    /vbscript:/gi,

    // Command injection patterns
    /[;&|`$(){}[\]]/,
    /\b(cat|ls|pwd|whoami|id|uname|ps|netstat|ifconfig|ping|nslookup|dig|curl|wget)\b/i,

    // Path traversal patterns
    /\.\.[\/\\]/,
    /[\/\\]etc[\/\\]/i,
    /[\/\\]proc[\/\\]/i,
    /[\/\\]sys[\/\\]/i,

    // LDAP injection patterns
    /[()=*!&|]/,

    // NoSQL injection patterns
    /\$where/i,
    /\$ne/i,
    /\$gt/i,
    /\$lt/i,
    /\$regex/i,
  ];

  private static readonly SUSPICIOUS_PATTERNS = [
    // Potential phishing indicators
    /urgent.{0,20}(action|response|verification)/i,
    /account.{0,20}(suspended|locked|compromised)/i,
    /click.{0,20}(here|now|immediately)/i,
    /verify.{0,20}(identity|account|information)/i,
    /limited.{0,20}time/i,

    // Cryptocurrency scam patterns
    /send.{0,20}(bitcoin|btc|ethereum|eth|crypto)/i,
    /wallet.{0,20}(address|seed|private.{0,10}key)/i,
    /investment.{0,20}opportunity/i,

    // Social engineering patterns
    /congratulations.{0,20}(winner|selected|chosen)/i,
    /claim.{0,20}(prize|reward|bonus)/i,
    /act.{0,20}(now|fast|quickly)/i,

    // Donation scam patterns
    /emergency.{0,20}(fund|donation)/i,
    /donate.{0,20}(now|immediately|urgent)/i,
    /(help|support).{0,20}(israel|idf)/i,
    /urgent.{0,20}donation/i,
  ];

  private static readonly ENCODING_PATTERNS = [
    // Base64 patterns (more specific to avoid false positives)
    /^[A-Za-z0-9+\/]{16,}={0,2}$/,
    /[A-Za-z0-9+\/]{32,}={0,2}/,

    // Hex encoding patterns
    /(?:0x|\\x|%)[0-9a-fA-F]{2,}/,

    // URL encoding patterns
    /%[0-9a-fA-F]{2}/,

    // Unicode escape patterns
    /\\u[0-9a-fA-F]{4}/,

    // HTML entity patterns
    /&[a-zA-Z][a-zA-Z0-9]*;/,
    /&#[0-9]+;/,
    /&#x[0-9a-fA-F]+;/,
  ];

  public static validateInput(input: string, options: ValidationOptions = {}): ValidationResult {
    const {
      maxLength = 10000,
      allowHTML = false,
      allowURLs = true,
      allowEmails = true,
      checkForMaliciousPatterns = true,
      customPatterns = [],
    } = options;

    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!input || typeof input !== 'string') {
      errors.push('Input must be a non-empty string');
      return { isValid: false, errors, warnings };
    }

    // Length validation
    if (input.length > maxLength) {
      errors.push(`Input exceeds maximum length of ${maxLength} characters`);
    }

    // Check for null bytes and control characters
    if (/\0/.test(input)) {
      errors.push('Input contains null bytes');
    }

    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(input)) {
      warnings.push('Input contains control characters');
    }

    // Check for malicious patterns
    if (checkForMaliciousPatterns) {
      for (const pattern of this.MALICIOUS_PATTERNS) {
        if (pattern.test(input)) {
          errors.push(`Potentially malicious pattern detected: ${pattern.source}`);
        }
      }
    }

    // Check for suspicious patterns
    for (const pattern of this.SUSPICIOUS_PATTERNS) {
      if (pattern.test(input)) {
        warnings.push(`Suspicious pattern detected: ${pattern.source}`);
      }
    }

    // Check for encoding attempts
    for (const pattern of this.ENCODING_PATTERNS) {
      if (pattern.test(input)) {
        warnings.push(`Encoded content detected: ${pattern.source}`);
      }
    }

    // HTML validation
    if (!allowHTML && /<[^>]+>/.test(input)) {
      warnings.push('HTML tags detected in input');
    }

    // URL validation
    if (!allowURLs && /https?:\/\/[^\s]+/.test(input)) {
      warnings.push('URLs detected in input');
    }

    // Email validation
    if (!allowEmails && /[^\s@]+@[^\s@]+\.[^\s@]+/.test(input)) {
      warnings.push('Email addresses detected in input');
    }

    // Custom pattern validation
    for (const pattern of customPatterns) {
      if (pattern.test(input)) {
        warnings.push(`Custom pattern matched: ${pattern.source}`);
      }
    }

    // Sanitize input if validation passes or if there are only warnings
    let sanitized: string | undefined;
    if (errors.length === 0) {
      sanitized = this.sanitizeInput(input, options);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitized,
    };
  }

  private static sanitizeInput(input: string, options: ValidationOptions): string {
    let sanitized = input;

    // Remove null bytes and control characters
    sanitized = sanitized.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // HTML encoding if HTML is not allowed
    if (!options.allowHTML) {
      sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }

    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    return sanitized;
  }

  public static validateJSON(jsonString: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const parsed = JSON.parse(jsonString);

      // Check for prototype pollution
      if (this.hasPrototypePollution(parsed)) {
        errors.push('Potential prototype pollution detected');
      }

      // Check for deeply nested objects (DoS protection)
      const depth = this.getObjectDepth(parsed);
      if (depth > 10) {
        warnings.push(`Object nesting depth (${depth}) exceeds recommended limit`);
      }

      // Check for large arrays (DoS protection)
      const arrayInfo = this.checkArraySizes(parsed);
      if (arrayInfo.maxSize > 1000) {
        warnings.push(`Large array detected (${arrayInfo.maxSize} elements)`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        sanitized: JSON.stringify(parsed),
      };
    } catch (error) {
      errors.push(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, errors, warnings };
    }
  }

  private static hasPrototypePollution(obj: any): boolean {
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];

    function checkObject(obj: any): boolean {
      if (obj === null || typeof obj !== 'object') {
        return false;
      }

      for (const key of Object.keys(obj)) {
        if (dangerousKeys.includes(key)) {
          return true;
        }

        if (typeof obj[key] === 'object' && checkObject(obj[key])) {
          return true;
        }
      }

      return false;
    }

    return checkObject(obj);
  }

  private static getObjectDepth(obj: any): number {
    if (obj === null || typeof obj !== 'object') {
      return 0;
    }

    let maxDepth = 0;
    for (const key of Object.keys(obj)) {
      const depth = this.getObjectDepth(obj[key]);
      maxDepth = Math.max(maxDepth, depth);
    }

    return maxDepth + 1;
  }

  private static checkArraySizes(obj: any): { maxSize: number; totalArrays: number } {
    let maxSize = 0;
    let totalArrays = 0;

    function checkValue(value: any): void {
      if (Array.isArray(value)) {
        totalArrays++;
        maxSize = Math.max(maxSize, value.length);
        value.forEach(checkValue);
      } else if (value !== null && typeof value === 'object') {
        Object.values(value).forEach(checkValue);
      }
    }

    checkValue(obj);
    return { maxSize, totalArrays };
  }

  public static logValidationEvent(
    input: string,
    result: ValidationResult,
    context: {
      ip: string;
      userAgent: string;
      endpoint: string;
    }
  ): void {
    if (result.errors.length > 0) {
      SecurityLogger.logEvent({
        type: 'invalid_input',
        severity: 'high',
        message: `Input validation failed: ${result.errors.join(', ')}`,
        ip: context.ip,
        userAgent: context.userAgent,
        endpoint: context.endpoint,
        metadata: {
          inputLength: input.length,
          errors: result.errors,
          warnings: result.warnings,
          inputPreview: input.substring(0, 100),
        },
      });
    } else if (result.warnings.length > 0) {
      SecurityLogger.logEvent({
        type: 'suspicious_activity',
        severity: 'medium',
        message: `Input validation warnings: ${result.warnings.join(', ')}`,
        ip: context.ip,
        userAgent: context.userAgent,
        endpoint: context.endpoint,
        metadata: {
          inputLength: input.length,
          warnings: result.warnings,
          inputPreview: input.substring(0, 100),
        },
      });
    }
  }
}
