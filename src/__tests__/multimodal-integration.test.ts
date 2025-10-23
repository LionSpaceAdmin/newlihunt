/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
/**
 * @jest-environment jsdom
 */

import { act, renderHook } from '@testing-library/react';
import { useScamAnalysis } from '../hooks/useScamAnalysis';
import { uploadImage } from '../utils/uploadService';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock WebSocket
class MockWebSocket {
  public readyState = WebSocket.OPEN;
  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data: string) {
    // Mock successful analysis response
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage(
          new MessageEvent('message', {
            data: JSON.stringify({
              type: 'analysis_complete',
              result: {
                summary: 'Test analysis completed',
                analysisData: {
                  riskScore: 25,
                  credibilityScore: 80,
                  classification: 'SAFE',
                  detectedRules: [],
                  recommendations: ['Verify through official channels'],
                  reasoning: 'Content appears legitimate',
                  debiasingStatus: {
                    anonymous_profile_neutralized: true,
                    patriotic_tokens_neutralized: true,
                    sentiment_penalty_capped: true,
                  },
                },
              },
            }),
          })
        );
      }
    }, 100);
  }

  close() {
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
}

(global as any).WebSocket = MockWebSocket;

describe('Multimodal Analysis Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('Image Upload Flow', () => {
    it('should upload image and trigger analysis', async () => {
      // Mock successful upload response
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          url: 'https://test-bucket.s3.amazonaws.com/test-image.jpg',
          size: 1024,
          contentType: 'image/jpeg',
        }),
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await uploadImage(file);

      expect(result.success).toBe(true);
      expect(result.url).toContain('s3.amazonaws.com');
    });

    it('should handle upload failures gracefully', async () => {
      // Mock upload failure
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 413,
        json: async () => ({
          success: false,
          error: 'File too large',
        }),
      });

      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });
      const result = await uploadImage(largeFile);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid file');
    });
  });

  describe('Multimodal Analysis Flow', () => {
    it('should analyze text and image together', async () => {
      const { result } = renderHook(() =>
        useScamAnalysis({
          websocketUrl: 'wss://test.com',
        })
      );

      await act(async () => {
        await result.current.sendMessage(
          'Check this donation request',
          'https://test-bucket.s3.amazonaws.com/test-image.jpg'
        );
      });

      // Wait for WebSocket response
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(result.current.currentAnalysis).toBeTruthy();
      expect(result.current.currentAnalysis?.summary).toBe('Test analysis completed');
      expect(result.current.messages).toHaveLength(2); // User message + AI response
    });

    it('should handle image processing errors', async () => {
      const { result } = renderHook(() =>
        useScamAnalysis({
          apiUrl: 'https://test-api.com',
        })
      );

      // Mock API error response
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Image processing failed',
          message: 'Invalid image URL',
        }),
      });

      await act(async () => {
        try {
          await result.current.sendMessage('Analyze this', 'https://invalid-url.com/image.jpg');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Security Validation', () => {
    it('should validate image types before upload', async () => {
      const invalidFile = new File(['test'], 'test.exe', { type: 'application/exe' });
      const result = await uploadImage(invalidFile);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid file');
    });

    it('should validate file sizes', async () => {
      // Create mock large file
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });
      const result = await uploadImage(largeFile);

      expect(result.success).toBe(false);
      expect(result.message).toContain('File too large');
    });
  });
});
