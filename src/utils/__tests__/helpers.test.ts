import {
  fileToBase64,
  validateImageFile,
  formatTimestamp,
  generateMessageId,
  sanitizeInput,
  extractDomain,
  isValidUrl,
  getRiskScoreColor,
  getCredibilityScoreColor,
  getClassificationColor,
  getSeverityColor,
  truncateText,
  copyToClipboard,
} from '../helpers';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
  },
});

describe('File Utilities', () => {
  describe('fileToBase64', () => {
    it('converts file to base64 string', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      
      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        result: 'data:text/plain;base64,dGVzdCBjb250ZW50',
        onload: null as any,
        onerror: null as any,
      };

      (global as any).FileReader = jest.fn(() => mockFileReader);

      const promise = fileToBase64(mockFile);
      
      // Simulate FileReader onload
      mockFileReader.onload();
      
      const result = await promise;
      expect(result).toBe('dGVzdCBjb250ZW50');
    });

    it('handles FileReader errors', async () => {
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        result: null,
        onload: null as any,
        onerror: null as any,
      };

      (global as any).FileReader = jest.fn(() => mockFileReader);

      const promise = fileToBase64(mockFile);
      
      // Simulate FileReader error
      const error = new Error('FileReader error');
      mockFileReader.onerror(error);
      
      await expect(promise).rejects.toThrow('FileReader error');
    });
  });

  describe('validateImageFile', () => {
    it('validates correct image files', () => {
      const validFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }); // 1MB

      const result = validateImageFile(validFile);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects invalid file types', () => {
      const invalidFile = new File([''], 'test.pdf', { type: 'application/pdf' });
      
      const result = validateImageFile(invalidFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('rejects files that are too large', () => {
      const largeFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeFile, 'size', { value: 15 * 1024 * 1024 }); // 15MB

      const result = validateImageFile(largeFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File too large');
    });

    it('accepts all supported image types', () => {
      const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      
      supportedTypes.forEach(type => {
        const file = new File([''], `test.${type.split('/')[1]}`, { type });
        Object.defineProperty(file, 'size', { value: 1024 }); // 1KB

        const result = validateImageFile(file);
        expect(result.isValid).toBe(true);
      });
    });
  });
});

describe('Text Utilities', () => {
  describe('formatTimestamp', () => {
    it('formats timestamp correctly', () => {
      const date = new Date('2023-10-23T14:30:00');
      const result = formatTimestamp(date);
      
      // Should return time in format like "2:30 PM"
      expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/);
    });
  });

  describe('generateMessageId', () => {
    it('generates unique message IDs', () => {
      const id1 = generateMessageId();
      const id2 = generateMessageId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^msg_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^msg_\d+_[a-z0-9]+$/);
    });
  });

  describe('sanitizeInput', () => {
    it('sanitizes HTML characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeInput(input);
      
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    it('handles various special characters', () => {
      const input = `<>"'&/`;
      const result = sanitizeInput(input);
      
      expect(result).toBe('&lt;&gt;&quot;&#x27;&amp;&#x2F;');
    });

    it('preserves safe content', () => {
      const input = 'This is safe content with numbers 123 and symbols !@#$%^*()';
      const result = sanitizeInput(input);
      
      expect(result).toBe('This is safe content with numbers 123 and symbols !@#$%^*()');
    });
  });

  describe('truncateText', () => {
    it('truncates long text', () => {
      const longText = 'This is a very long text that should be truncated';
      const result = truncateText(longText, 20);
      
      expect(result).toBe('This is a very long ...');
      expect(result.length).toBe(23); // 20 + '...'
    });

    it('does not truncate short text', () => {
      const shortText = 'Short text';
      const result = truncateText(shortText, 20);
      
      expect(result).toBe('Short text');
    });

    it('handles edge cases', () => {
      expect(truncateText('', 10)).toBe('');
      expect(truncateText('abc', 3)).toBe('abc');
      expect(truncateText('abcd', 3)).toBe('abc...');
    });
  });
});

describe('URL Utilities', () => {
  describe('extractDomain', () => {
    it('extracts domain from valid URLs', () => {
      expect(extractDomain('https://example.com/path')).toBe('example.com');
      expect(extractDomain('http://subdomain.example.org')).toBe('subdomain.example.org');
      expect(extractDomain('https://example.co.uk/path?query=1')).toBe('example.co.uk');
    });

    it('returns null for invalid URLs', () => {
      expect(extractDomain('not-a-url')).toBe(null);
      expect(extractDomain('ftp://example.com')).toBe('example.com'); // Still valid URL
      expect(extractDomain('')).toBe(null);
    });
  });

  describe('isValidUrl', () => {
    it('validates correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://subdomain.example.com/path?query=1#hash')).toBe(true);
    });

    it('rejects invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false); // Missing protocol
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('javascript:alert(1)')).toBe(true); // Technically valid URL
    });
  });
});

describe('Color Utilities', () => {
  describe('getRiskScoreColor', () => {
    it('returns correct colors for risk scores', () => {
      expect(getRiskScoreColor(10)).toBe('text-green-500'); // Low risk
      expect(getRiskScoreColor(50)).toBe('text-yellow-500'); // Medium risk
      expect(getRiskScoreColor(80)).toBe('text-red-500'); // High risk
    });

    it('handles edge cases', () => {
      expect(getRiskScoreColor(0)).toBe('text-green-500');
      expect(getRiskScoreColor(39)).toBe('text-green-500');
      expect(getRiskScoreColor(40)).toBe('text-yellow-500');
      expect(getRiskScoreColor(69)).toBe('text-yellow-500');
      expect(getRiskScoreColor(70)).toBe('text-red-500');
      expect(getRiskScoreColor(100)).toBe('text-red-500');
    });
  });

  describe('getCredibilityScoreColor', () => {
    it('returns correct colors for credibility scores', () => {
      expect(getCredibilityScoreColor(80)).toBe('text-green-500'); // High credibility
      expect(getCredibilityScoreColor(50)).toBe('text-yellow-500'); // Medium credibility
      expect(getCredibilityScoreColor(20)).toBe('text-red-500'); // Low credibility
    });
  });

  describe('getClassificationColor', () => {
    it('returns correct colors for classifications', () => {
      expect(getClassificationColor('SAFE')).toBe('text-green-500 bg-green-100');
      expect(getClassificationColor('SUSPICIOUS')).toBe('text-yellow-600 bg-yellow-100');
      expect(getClassificationColor('HIGH_RISK')).toBe('text-red-600 bg-red-100');
      expect(getClassificationColor('UNKNOWN')).toBe('text-gray-600 bg-gray-100');
    });
  });

  describe('getSeverityColor', () => {
    it('returns correct colors for severity levels', () => {
      expect(getSeverityColor('LOW')).toBe('bg-blue-500');
      expect(getSeverityColor('MEDIUM')).toBe('bg-yellow-500');
      expect(getSeverityColor('HIGH')).toBe('bg-red-500');
      expect(getSeverityColor('UNKNOWN')).toBe('bg-gray-500');
    });
  });
});

describe('Clipboard Utilities', () => {
  describe('copyToClipboard', () => {
    it('copies text using modern clipboard API', async () => {
      const text = 'Test text to copy';
      
      const result = await copyToClipboard(text);
      
      expect(result).toBe(true);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text);
    });

    it('falls back to legacy method when clipboard API fails', async () => {
      // Mock clipboard API to fail
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(new Error('Clipboard API failed'));
      
      // Mock document methods for fallback
      const mockTextArea = {
        value: '',
        focus: jest.fn(),
        select: jest.fn(),
        style: {},
      };
      
      const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockTextArea as any);
      const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation();
      const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation();
      const execCommandSpy = jest.spyOn(document, 'execCommand').mockReturnValue(true);
      
      const text = 'Test text to copy';
      const result = await copyToClipboard(text);
      
      expect(result).toBe(true);
      expect(createElementSpy).toHaveBeenCalledWith('textarea');
      expect(mockTextArea.value).toBe(text);
      expect(execCommandSpy).toHaveBeenCalledWith('copy');
      
      // Cleanup
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      execCommandSpy.mockRestore();
    });

    it('returns false when both methods fail', async () => {
      // Mock clipboard API to fail
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(new Error('Clipboard API failed'));
      
      // Mock fallback to fail
      jest.spyOn(document, 'execCommand').mockReturnValue(false);
      
      const result = await copyToClipboard('test');
      
      expect(result).toBe(false);
    });
  });
});

// Performance tests
describe('Performance Tests', () => {
  it('handles large text sanitization efficiently', () => {
    const largeText = '<script>'.repeat(10000) + 'content' + '</script>'.repeat(10000);
    
    const startTime = performance.now();
    const result = sanitizeInput(largeText);
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    expect(result).toContain('&lt;script&gt;');
  });

  it('generates message IDs quickly', () => {
    const startTime = performance.now();
    
    const ids = Array.from({ length: 1000 }, () => generateMessageId());
    
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(50); // Should complete in under 50ms
    expect(new Set(ids).size).toBe(1000); // All IDs should be unique
  });
});

// Edge cases and error handling
describe('Edge Cases', () => {
  it('handles null and undefined inputs gracefully', () => {
    expect(() => sanitizeInput(null as any)).not.toThrow();
    expect(() => sanitizeInput(undefined as any)).not.toThrow();
    expect(() => truncateText(null as any, 10)).not.toThrow();
    expect(() => extractDomain(null as any)).not.toThrow();
  });

  it('handles empty inputs', () => {
    expect(sanitizeInput('')).toBe('');
    expect(truncateText('', 10)).toBe('');
    expect(extractDomain('')).toBe(null);
    expect(isValidUrl('')).toBe(false);
  });

  it('handles extreme values', () => {
    expect(getRiskScoreColor(-10)).toBe('text-green-500');
    expect(getRiskScoreColor(150)).toBe('text-red-500');
    expect(truncateText('abc', 0)).toBe('...');
    expect(truncateText('abc', -5)).toBe('...');
  });
});