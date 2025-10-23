/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-function-type */
/**
 * @jest-environment jsdom
 */

import {
    createImagePreview,
    formatFileSize,
    getFileExtension,
    uploadImage,
    validateImageFile,
} from '../uploadService';

// Mock XMLHttpRequest
class MockXMLHttpRequest {
  public readyState = 0;
  public status = 200;
  public statusText = 'OK';
  public responseText = '';
  public timeout = 0;
  public upload = {
    addEventListener: jest.fn(),
  };

  private listeners: { [key: string]: Function[] } = {};

  addEventListener(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  open(method: string, url: string) {
    // Mock implementation
  }

  send(data: any) {
    // Simulate successful upload
    setTimeout(() => {
      this.responseText = JSON.stringify({
        success: true,
        url: 'https://test-bucket.s3.amazonaws.com/test-image.jpg',
        key: 'uploads/test-image.jpg',
        size: 1024,
        contentType: 'image/jpeg',
        originalName: 'test.jpg',
      });

      this.triggerEvent('load');
    }, 10);
  }

  private triggerEvent(eventName: string) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach(callback => callback());
    }
  }
}

// Mock global XMLHttpRequest
(global as any).XMLHttpRequest = MockXMLHttpRequest;

describe('uploadService', () => {
  describe('validateImageFile', () => {
    it('should validate valid image files', () => {
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = validateImageFile(validFile);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject files that are too large', () => {
      // Create a mock file that's larger than 10MB
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });
      const result = validateImageFile(largeFile);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File too large');
    });

    it('should reject invalid file types', () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const result = validateImageFile(invalidFile);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should reject missing files', () => {
      const result = validateImageFile(null as any);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('No file provided');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should handle decimal places', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1024 * 1024 * 1.5)).toBe('1.5 MB');
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extensions correctly', () => {
      expect(getFileExtension('test.jpg')).toBe('jpg');
      expect(getFileExtension('image.png')).toBe('png');
      expect(getFileExtension('file.with.dots.webp')).toBe('webp');
    });

    it('should handle files without extensions', () => {
      expect(getFileExtension('filename')).toBe('');
    });
  });

  describe('createImagePreview', () => {
    it('should create preview URL for valid image', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null as any,
        onerror: null as any,
        result: 'data:image/jpeg;base64,dGVzdA==',
      };

      (global as any).FileReader = jest.fn(() => mockFileReader);

      const previewPromise = createImagePreview(file);

      // Simulate successful read
      setTimeout(() => {
        mockFileReader.onload({ target: { result: mockFileReader.result } });
      }, 10);

      const preview = await previewPromise;
      expect(preview).toBe('data:image/jpeg;base64,dGVzdA==');
    });
  });

  describe('uploadImage', () => {
    it('should upload valid image successfully', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const onProgress = jest.fn();

      const result = await uploadImage(file, { onProgress });

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://test-bucket.s3.amazonaws.com/test-image.jpg');
      expect(result.size).toBe(1024);
      expect(result.contentType).toBe('image/jpeg');
    });

    it('should reject invalid files', async () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      const result = await uploadImage(invalidFile);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid file');
      expect(result.retryable).toBe(false);
    });

    it('should call progress callback during upload', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const onProgress = jest.fn();

      // Create a more sophisticated mock that triggers progress
      class ProgressMockXMLHttpRequest extends MockXMLHttpRequest {
        send(data: any) {
          // Trigger progress event first
          setTimeout(() => {
            if (this.upload.addEventListener) {
              const progressCallback = (this.upload.addEventListener as jest.Mock).mock.calls.find(
                call => call[0] === 'progress'
              )?.[1];

              if (progressCallback) {
                progressCallback({
                  lengthComputable: true,
                  loaded: 512,
                  total: 1024,
                });
              }
            }
          }, 5);

          // Then complete the upload
          super.send(data);
        }
      }

      (global as any).XMLHttpRequest = ProgressMockXMLHttpRequest;

      await uploadImage(file, { onProgress });

      expect(onProgress).toHaveBeenCalledWith({
        loaded: 512,
        total: 1024,
        percentage: 50,
      });
    });
  });
});
