// Test multimodal analysis functionality
const { handler } = require('./index');
const GeminiClient = require('./gemini-client');

// Mock environment variables
process.env.GEMINI_API_KEY = 'test-api-key';

// Mock GeminiClient
jest.mock('./gemini-client');

describe('Multimodal Analysis Lambda', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Image URL Processing', () => {
    it('should process image URL successfully', async () => {
      // Mock successful analysis
      const mockAnalysis = {
        summary: 'Analysis completed',
        analysisData: {
          riskScore: 30,
          credibilityScore: 75,
          classification: 'SAFE',
          detectedRules: [],
          recommendations: ['Verify through official channels'],
          reasoning: 'Content appears legitimate',
          debiasingStatus: {
            anonymous_profile_neutralized: true,
            patriotic_tokens_neutralized: true,
            sentiment_penalty_capped: true
          }
        }
      };

      GeminiClient.mockImplementation(() => ({
        generateAnalysis: jest.fn().mockResolvedValue(mockAnalysis)
      }));

      GeminiClient.processImageData = jest.fn().mockReturnValue({
        base64: 'dGVzdA==',
        mimeType: 'image/jpeg',
        estimatedSize: 1024
      });

      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          message: 'Check this donation request',
          imageUrl: 'https://test-bucket.s3.amazonaws.com/test-image.jpg'
        })
      };

      // Mock https.get for image fetching
      const mockResponse = {
        statusCode: 200,
        headers: { 'content-type': 'image/jpeg', 'content-length': '1024' },
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(Buffer.from('test'));
          } else if (event === 'end') {
            callback();
          }
        })
      };

      const mockRequest = {
        on: jest.fn(),
        setTimeout: jest.fn(),
        destroy: jest.fn()
      };

      require('https').get = jest.fn((url, callback) => {
        callback(mockResponse);
        return mockRequest;
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.summary).toBe('Analysis completed');
      expect(body.metadata.hasImage).toBe(true);
    });

    it('should handle image fetch failures', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          message: 'Check this',
          imageUrl: 'https://invalid-url.com/image.jpg'
        })
      };

      // Mock failed image fetch
      const mockRequest = {
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            callback(new Error('Network error'));
          }
        }),
        setTimeout: jest.fn(),
        destroy: jest.fn()
      };

      require('https').get = jest.fn(() => mockRequest);

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Image processing failed');
    });
  });

  describe('Backward Compatibility', () => {
    it('should still handle base64 image data', async () => {
      const mockAnalysis = {
        summary: 'Base64 analysis completed',
        analysisData: {
          riskScore: 20,
          credibilityScore: 85,
          classification: 'SAFE',
          detectedRules: [],
          recommendations: [],
          reasoning: 'Legitimate content',
          debiasingStatus: {
            anonymous_profile_neutralized: true,
            patriotic_tokens_neutralized: true,
            sentiment_penalty_capped: true
          }
        }
      };

      GeminiClient.mockImplementation(() => ({
        generateAnalysis: jest.fn().mockResolvedValue(mockAnalysis)
      }));

      GeminiClient.processImageData = jest.fn().mockReturnValue({
        base64: 'dGVzdA==',
        mimeType: 'image/jpeg',
        estimatedSize: 1024
      });

      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          message: 'Check this',
          imageBase64: 'dGVzdA==',
          imageMimeType: 'image/jpeg'
        })
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.summary).toBe('Base64 analysis completed');
    });
  });
});