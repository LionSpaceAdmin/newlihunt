/**
 * Security Integration Tests
 *
 * These tests verify that security measures are properly integrated
 * across the application's API endpoints.
 */

import { NextRequest } from 'next/server';
import { GET as historyGET, POST as historyPOST } from '@/app/api/history/route';
import { GET as historyItemGET, PATCH as historyItemPATCH } from '@/app/api/history/[id]/route';

// Mock the storage service
jest.mock('@/lib/storage', () => ({
  getStorageService: () => ({
    getUserHistory: jest.fn().mockResolvedValue([]),
    saveAnalysis: jest.fn().mockResolvedValue('test-id'),
    getAnalysis: jest.fn().mockResolvedValue({
      id: 'test-id',
      userId: 'test-user',
      timestamp: new Date(),
      result: { riskScore: 50, credibilityScore: 75 },
    }),
    updateAnalysisFeedback: jest.fn().mockResolvedValue(undefined),
    getSession: jest.fn().mockResolvedValue({ analysisCount: 1, feedbackGiven: 0 }),
    createSession: jest.fn().mockResolvedValue({ analysisCount: 0, feedbackGiven: 0 }),
    updateSession: jest.fn().mockResolvedValue(undefined),
    getProviderType: jest.fn().mockReturnValue('memory'),
  }),
}));

// Mock user identification
jest.mock('@/lib/user-identification', () => ({
  getUserId: jest.fn().mockReturnValue('test-user-id'),
}));

// Helper to create mock requests
const createMockRequest = (
  url: string,
  options: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
    ip?: string;
  } = {}
): NextRequest => {
  const { method = 'GET', body, headers = {}, ip = '127.0.0.1' } = options;

  const request = new NextRequest(url, {
    method,
    body,
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': ip,
      'user-agent': 'test-agent',
      ...headers,
    },
  });

  return request;
};

describe('Security Integration Tests', () => {
  describe('Rate Limiting', () => {
    it('should apply rate limiting to history GET endpoint', async () => {
      const url = 'http://localhost:3000/api/history';

      // Make multiple requests quickly
      const requests = Array(35)
        .fill(null)
        .map(() => historyGET(createMockRequest(url)));

      const responses = await Promise.all(requests);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(response => response.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should apply rate limiting to history POST endpoint', async () => {
      const url = 'http://localhost:3000/api/history';
      const body = JSON.stringify({
        analysis: { riskScore: 50, credibilityScore: 75 },
        conversation: [{ id: '1', role: 'user', content: 'test', timestamp: new Date() }],
        input: { message: 'test message' },
      });

      // Make multiple requests quickly
      const requests = Array(35)
        .fill(null)
        .map(() => historyPOST(createMockRequest(url, { method: 'POST', body })));

      const responses = await Promise.all(requests);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(response => response.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should differentiate rate limits by IP address', async () => {
      const url = 'http://localhost:3000/api/history';

      // Make requests from different IPs
      const ip1Requests = Array(20)
        .fill(null)
        .map(() => historyGET(createMockRequest(url, { ip: '192.168.1.1' })));

      const ip2Requests = Array(20)
        .fill(null)
        .map(() => historyGET(createMockRequest(url, { ip: '192.168.1.2' })));

      const [ip1Responses, ip2Responses] = await Promise.all([
        Promise.all(ip1Requests),
        Promise.all(ip2Requests),
      ]);

      // Both IPs should have some successful requests
      const ip1Success = ip1Responses.filter(r => r.status === 200).length;
      const ip2Success = ip2Responses.filter(r => r.status === 200).length;

      expect(ip1Success).toBeGreaterThan(0);
      expect(ip2Success).toBeGreaterThan(0);
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should reject malicious SQL injection attempts', async () => {
      const url = 'http://localhost:3000/api/history';
      const maliciousBody = JSON.stringify({
        analysis: { riskScore: 50, credibilityScore: 75 },
        conversation: [{ id: '1', role: 'user', content: 'test', timestamp: new Date() }],
        input: { message: "'; DROP TABLE users; --" },
      });

      const response = await historyPOST(
        createMockRequest(url, { method: 'POST', body: maliciousBody })
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('Invalid input');
    });

    it('should reject XSS attempts', async () => {
      const url = 'http://localhost:3000/api/history';
      const xssBody = JSON.stringify({
        analysis: { riskScore: 50, credibilityScore: 75 },
        conversation: [{ id: '1', role: 'user', content: 'test', timestamp: new Date() }],
        input: { message: '<script>alert("xss")</script>' },
      });

      const response = await historyPOST(createMockRequest(url, { method: 'POST', body: xssBody }));

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('Invalid input');
    });

    it('should sanitize valid input', async () => {
      const url = 'http://localhost:3000/api/history';
      const body = JSON.stringify({
        analysis: { riskScore: 50, credibilityScore: 75 },
        conversation: [{ id: '1', role: 'user', content: 'test', timestamp: new Date() }],
        input: { message: 'Hello <b>world</b>!' },
      });

      const response = await historyPOST(createMockRequest(url, { method: 'POST', body: body }));

      expect(response.status).toBe(200);
    });

    it('should reject oversized requests', async () => {
      const url = 'http://localhost:3000/api/history';
      const largeMessage = 'x'.repeat(15000); // Exceeds 10KB limit
      const largeBody = JSON.stringify({
        analysis: { riskScore: 50, credibilityScore: 75 },
        conversation: [{ id: '1', role: 'user', content: 'test', timestamp: new Date() }],
        input: { message: largeMessage },
      });

      const response = await historyPOST(
        createMockRequest(url, { method: 'POST', body: largeBody })
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('Invalid input');
    });

    it('should validate JSON structure', async () => {
      const url = 'http://localhost:3000/api/history';
      const invalidJson = '{"analysis": {"riskScore": 50}, "conversation":}'; // Invalid JSON

      const response = await historyPOST(
        createMockRequest(url, { method: 'POST', body: invalidJson })
      );

      expect(response.status).toBe(500); // JSON parsing error handled by middleware
    });

    it('should validate required fields', async () => {
      const url = 'http://localhost:3000/api/history';
      const incompleteBody = JSON.stringify({
        analysis: { riskScore: 50, credibilityScore: 75 },
        // Missing conversation and input
      });

      const response = await historyPOST(
        createMockRequest(url, { method: 'POST', body: incompleteBody })
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('Missing required fields');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const url = 'http://localhost:3000/api/history';
      const response = await historyGET(createMockRequest(url));

      // Check for security headers
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    });

    it('should include rate limit headers', async () => {
      const url = 'http://localhost:3000/api/history';
      const response = await historyGET(createMockRequest(url));

      expect(response.headers.get('X-RateLimit-Limit')).toBeTruthy();
      expect(response.headers.get('X-RateLimit-Remaining')).toBeTruthy();
      expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();
    });

    it('should include retry-after header when rate limited', async () => {
      const url = 'http://localhost:3000/api/history';

      // Exhaust rate limit
      const requests = Array(35)
        .fill(null)
        .map(() => historyGET(createMockRequest(url)));

      const responses = await Promise.all(requests);
      const rateLimitedResponse = responses.find(r => r.status === 429);

      if (rateLimitedResponse) {
        expect(rateLimitedResponse.headers.get('Retry-After')).toBeTruthy();
        expect(rateLimitedResponse.headers.get('X-RateLimit-Remaining')).toBe('0');
      }
    });
  });

  describe('Parameter Validation', () => {
    it('should validate and sanitize URL parameters', async () => {
      const maliciousId = '<script>alert(1)</script>';
      const url = `http://localhost:3000/api/history/${encodeURIComponent(maliciousId)}`;

      const response = await historyItemGET(createMockRequest(url), {
        params: { id: maliciousId },
      });

      // Should handle the malicious ID gracefully
      expect(response.status).toBe(404); // Not found after sanitization
    });

    it('should validate feedback values', async () => {
      const url = 'http://localhost:3000/api/history/test-id';
      const invalidFeedback = JSON.stringify({ feedback: 'invalid' });

      const response = await historyItemPATCH(
        createMockRequest(url, { method: 'PATCH', body: invalidFeedback }),
        { params: { id: 'test-id' } }
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('Valid feedback');
    });

    it('should accept valid feedback values', async () => {
      const url = 'http://localhost:3000/api/history/test-id';
      const validFeedback = JSON.stringify({ feedback: 'positive' });

      const response = await historyItemPATCH(
        createMockRequest(url, { method: 'PATCH', body: validFeedback }),
        { params: { id: 'test-id' } }
      );

      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should not expose sensitive information in error messages', async () => {
      const url = 'http://localhost:3000/api/history';

      // Mock storage service to throw an error
      const mockStorageService = {
        getUserHistory: jest
          .fn()
          .mockRejectedValue(new Error('Database connection failed: password=secret123')),
        getProviderType: jest.fn().mockReturnValue('memory'),
      };

      jest.doMock('@/lib/storage', () => ({
        getStorageService: () => mockStorageService,
      }));

      const response = await historyGET(createMockRequest(url));

      expect(response.status).toBe(500);
      const body = await response.json();

      // Should not expose sensitive database details
      expect(body.message).not.toContain('password=secret123');
      expect(body.error).toBe('Failed to retrieve history');
    });

    it('should log security events for suspicious activity', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const url = 'http://localhost:3000/api/history';
      const maliciousBody = JSON.stringify({
        analysis: { riskScore: 50, credibilityScore: 75 },
        conversation: [{ id: '1', role: 'user', content: 'test', timestamp: new Date() }],
        input: { message: "'; DROP TABLE users; --" },
      });

      await historyPOST(createMockRequest(url, { method: 'POST', body: maliciousBody }));

      // Should log security event
      expect(consoleSpy).toHaveBeenCalledWith(
        'Security Event:',
        expect.objectContaining({
          type: 'invalid_input',
          severity: expect.any(String),
          message: expect.stringContaining('Invalid input'),
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('CORS and Origin Validation', () => {
    it('should handle CORS preflight requests', async () => {
      const url = 'http://localhost:3000/api/history';
      const request = createMockRequest(url, {
        method: 'OPTIONS',
        headers: {
          origin: 'https://example.com',
          'access-control-request-method': 'POST',
          'access-control-request-headers': 'content-type',
        },
      });

      const response = await historyPOST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeTruthy();
      expect(response.headers.get('Access-Control-Allow-Headers')).toBeTruthy();
    });
  });

  describe('Content Type Validation', () => {
    it('should reject requests with invalid content types', async () => {
      const url = 'http://localhost:3000/api/history';
      const request = createMockRequest(url, {
        method: 'POST',
        body: 'plain text body',
        headers: {
          'content-type': 'text/plain',
        },
      });

      const response = await historyPOST(request);

      // Should handle gracefully, likely resulting in JSON parse error
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should accept valid JSON content type', async () => {
      const url = 'http://localhost:3000/api/history';
      const body = JSON.stringify({
        analysis: { riskScore: 50, credibilityScore: 75 },
        conversation: [{ id: '1', role: 'user', content: 'test', timestamp: new Date() }],
        input: { message: 'test message' },
      });

      const request = createMockRequest(url, {
        method: 'POST',
        body,
        headers: {
          'content-type': 'application/json',
        },
      });

      const response = await historyPOST(request);

      expect(response.status).toBe(200);
    });
  });
});
