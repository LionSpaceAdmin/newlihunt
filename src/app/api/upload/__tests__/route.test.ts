import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../route';

// Mock @vercel/blob
vi.mock('@vercel/blob', () => ({
  put: vi.fn(),
}));

// Mock rate limiter
vi.mock('@/lib/middleware/rate-limiter', () => ({
  uploadRateLimiter: {
    checkRateLimit: vi.fn(),
  },
}));

import { uploadRateLimiter } from '@/lib/middleware/rate-limiter';
import { put } from '@vercel/blob';

describe('/api/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default: rate limit allows request
    vi.mocked(uploadRateLimiter.checkRateLimit).mockResolvedValue({
      allowed: true,
      limit: 5,
      remaining: 4,
      resetTime: Date.now() + 60000,
    });
  });

  it('should upload valid image file', async () => {
    const mockBlobUrl = 'https://blob.vercel-storage.com/test-abc123.jpg';
    vi.mocked(put).mockResolvedValue({
      url: mockBlobUrl,
      pathname: 'test-abc123.jpg',
      contentType: 'image/jpeg',
      contentDisposition: 'inline',
    } as any);

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 * 1024 });

    const formData = new FormData();
    formData.append('file', file);

    // Mock formData method on request
    const request = {
      formData: vi.fn().mockResolvedValue(formData),
    } as any;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.url).toBe(mockBlobUrl);
    expect(data.size).toBe(1024 * 1024);
    expect(data.type).toBe('image/jpeg');
  });

  it('should reject request without file', async () => {
    const formData = new FormData();

    const request = {
      formData: vi.fn().mockResolvedValue(formData),
    } as any;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('No file provided');
  });

  it('should reject invalid file type', async () => {
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 1024 });

    const formData = new FormData();
    formData.append('file', file);

    const request = {
      formData: vi.fn().mockResolvedValue(formData),
    } as any;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid file type');
  });

  it('should reject file larger than 10MB', async () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 });

    const formData = new FormData();
    formData.append('file', file);

    const request = {
      formData: vi.fn().mockResolvedValue(formData),
    } as any;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('File too large');
  });

  it('should enforce rate limiting', async () => {
    vi.mocked(uploadRateLimiter.checkRateLimit).mockResolvedValue({
      allowed: false,
      limit: 5,
      remaining: 0,
      resetTime: Date.now() + 60000,
      retryAfter: 60,
    });

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 });

    const formData = new FormData();
    formData.append('file', file);

    const request = {
      formData: vi.fn().mockResolvedValue(formData),
    } as any;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toContain('Too many uploads');
    expect(response.headers.get('Retry-After')).toBe('60');
  });

  it('should handle upload errors gracefully', async () => {
    vi.mocked(put).mockRejectedValue(new Error('Blob storage error'));

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 });

    const formData = new FormData();
    formData.append('file', file);

    const request = {
      formData: vi.fn().mockResolvedValue(formData),
    } as any;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Failed to upload file');
  });
});
