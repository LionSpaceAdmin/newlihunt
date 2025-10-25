import { describe, expect, it } from 'vitest';
import { formatFileSize, validateImageFile } from '../uploadService';

describe('uploadService', () => {
  describe('validateImageFile', () => {
    it('should accept valid JPEG file', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB
      
      const result = validateImageFile(file);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid PNG file', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 });
      
      const result = validateImageFile(file);
      
      expect(result.isValid).toBe(true);
    });

    it('should accept valid WebP file', () => {
      const file = new File(['test'], 'test.webp', { type: 'image/webp' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 });
      
      const result = validateImageFile(file);
      
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid file type', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 });
      
      const result = validateImageFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should reject file larger than 10MB', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 }); // 11MB
      
      const result = validateImageFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File too large');
    });

    it('should accept file exactly 10MB', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }); // 10MB
      
      const result = validateImageFile(file);
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500 bytes');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
    });
  });
});
