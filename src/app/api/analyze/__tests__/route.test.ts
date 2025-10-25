import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../route';

// Mock dependencies
vi.mock('@/lib/gemini-service', () => ({
  analyzeWithGemini: vi.fn(),
}));

vi.mock('@vercel/kv', () => ({
  kv: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('@/lib/middleware', () => ({
  analysisMiddleware: [],
  withMiddleware: (handler: any) => handler,
}));

import { analyzeWithGemini } from '@/lib/gemini-service';
import { kv } from '@vercel/kv';

describe('/api/analyze', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful analysis
    vi.mocked(analyzeWithGemini).mockResolvedValue({
      riskScore: 75,
      credibilityScore: 30,
      verdict: 'High Risk',
      reasoning: 'Test reasoning',
      redFlags: ['Test flag'],
      recommendations: ['Test recommendation'],
    } as any);

    // Mock cache miss
    vi.mocked(kv.get).mockResolvedValue(null);
    vi.mocked(kv.set).mockResolvedValue('OK');
  });

  it('should analyze text message', async () => {
    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Test message',
        conversationHistory: [],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.riskScore).toBe(75);
    expect(data.verdict).toBe('High Risk');
    expect(analyzeWithGemini).toHaveBeenCalledWith(
      'Test message',
      [],
      undefined,
      undefined
    );
  });

  it('should fetch and analyze image from Blob URL', async () => {
    const mockImageUrl = 'https://blob.vercel-storage.com/test.jpg';
    const mockImageBuffer = Buffer.from('fake-image-data');

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(mockImageBuffer.buffer),
      headers: new Headers({ 'content-type': 'image/jpeg' }),
    });

    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Analyze this image',
        imageUrl: mockImageUrl,
        conversationHistory: [],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(mockImageUrl);
    expect(analyzeWithGemini).toHaveBeenCalledWith(
      'Analyze this image',
      [],
      expect.any(String), // base64
      'image/jpeg'
    );
  });

  it('should return error if no message or image provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: JSON.stringify({
        conversationHistory: [],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Message or image required');
  });

  it('should handle image fetch failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Test',
        imageUrl: 'https://blob.vercel-storage.com/nonexistent.jpg',
        conversationHistory: [],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Failed to fetch image');
  });

  it('should use cache for repeated requests', async () => {
    const cachedResult = {
      riskScore: 50,
      credibilityScore: 50,
      verdict: 'Cached',
    };

    vi.mocked(kv.get).mockResolvedValue(cachedResult);

    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Test message',
        conversationHistory: [],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(cachedResult);
    expect(analyzeWithGemini).not.toHaveBeenCalled();
  });

  it('should not cache conversational requests', async () => {
    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Follow-up question',
        conversationHistory: [
          { role: 'user', content: 'Previous message', timestamp: new Date() },
        ],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(kv.get).not.toHaveBeenCalled();
    expect(kv.set).not.toHaveBeenCalled();
  });

  it('should reject invalid image type', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(Buffer.from('data').buffer),
      headers: new Headers({ 'content-type': 'application/pdf' }),
    });

    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Test',
        imageUrl: 'https://blob.vercel-storage.com/file.pdf',
        conversationHistory: [],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid image type');
  });
});
