import { HistoryService, resetHistoryService } from '../history-service';
import { FullAnalysisResult, Classification, Severity, Message } from '@/types/analysis';

// Mock fetch globally
global.fetch = jest.fn();

// Mock user identification
jest.mock('../user-identification', () => ({
  getUserId: jest.fn(() => 'test-user-123'),
}));

describe('HistoryService', () => {
  let historyService: HistoryService;
  let mockAnalysis: FullAnalysisResult;
  let mockConversation: Message[];

  beforeEach(() => {
    resetHistoryService();
    historyService = new HistoryService('/api');

    mockAnalysis = {
      summary: 'Test analysis summary',
      analysisData: {
        riskScore: 75,
        credibilityScore: 25,
        classification: Classification.SUSPICIOUS,
        detectedRules: [
          {
            id: 'rule1',
            name: 'Test Rule',
            severity: Severity.MEDIUM,
            description: 'Test rule description',
            points: 10,
          },
        ],
        recommendations: ['Test recommendation'],
        reasoning: 'Test reasoning',
        debiasingStatus: {
          anonymous_profile_neutralized: true,
          patriotic_tokens_neutralized: false,
          sentiment_penalty_capped: true,
        },
      },
    };

    mockConversation = [
      {
        id: 'msg1',
        role: 'user',
        content: 'Test message',
        timestamp: new Date('2023-10-23T14:29:00Z'),
      },
      {
        id: 'msg2',
        role: 'assistant',
        content: 'Test response',
        timestamp: new Date('2023-10-23T14:30:00Z'),
      },
    ];

    // Reset fetch mock
    (fetch as jest.Mock).mockClear();
  });

  describe('saveAnalysis', () => {
    it('saves analysis successfully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          id: 'analysis-123',
          provider: 'memory',
        }),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await historyService.saveAnalysis({
        analysis: mockAnalysis,
        conversation: mockConversation,
        input: { message: 'Test input' },
        processingTime: 1500,
      });

      expect(result.success).toBe(true);
      expect(result.id).toBe('analysis-123');
      expect(fetch).toHaveBeenCalledWith('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"userId":"test-user-123"'),
      });
    });

    it('handles API errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({
          error: 'Internal server error',
        }),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await historyService.saveAnalysis({
        analysis: mockAnalysis,
        conversation: mockConversation,
        input: { message: 'Test input' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Internal server error');
    });

    it('handles network errors', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await historyService.saveAnalysis({
        analysis: mockAnalysis,
        conversation: mockConversation,
        input: { message: 'Test input' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('getUserHistory', () => {
    it('retrieves user history successfully', async () => {
      const mockHistory = [
        {
          id: 'analysis-1',
          userId: 'test-user-123',
          timestamp: new Date('2023-10-23T14:30:00Z'),
          input: { message: 'Test input 1' },
          result: mockAnalysis,
          conversation: mockConversation,
          metadata: {
            userAgent: 'Test Agent',
            ipHash: 'hash123',
            processingTime: 1500,
          },
        },
      ];

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          history: mockHistory,
          provider: 'memory',
        }),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await historyService.getUserHistory(25);

      expect(result.success).toBe(true);
      expect(result.history).toEqual(mockHistory);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/history?userId=test-user-123&limit=25')
      );
    });

    it('handles empty history', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          history: [],
          provider: 'memory',
        }),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await historyService.getUserHistory();

      expect(result.success).toBe(true);
      expect(result.history).toEqual([]);
    });
  });

  describe('getAnalysis', () => {
    it('retrieves specific analysis successfully', async () => {
      const mockStoredAnalysis = {
        id: 'analysis-123',
        userId: 'test-user-123',
        timestamp: new Date('2023-10-23T14:30:00Z'),
        input: { message: 'Test input' },
        result: mockAnalysis,
        conversation: mockConversation,
        metadata: {
          userAgent: 'Test Agent',
          ipHash: 'hash123',
          processingTime: 1500,
        },
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          analysis: mockStoredAnalysis,
          provider: 'memory',
        }),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await historyService.getAnalysis('analysis-123');

      expect(result.success).toBe(true);
      expect(result.analysis).toEqual(mockStoredAnalysis);
      expect(fetch).toHaveBeenCalledWith('/api/history/analysis-123');
    });

    it('handles not found analysis', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({
          success: false,
          error: 'Analysis not found',
        }),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await historyService.getAnalysis('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Analysis not found');
    });
  });

  describe('submitFeedback', () => {
    it('submits positive feedback successfully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          message: 'Feedback updated successfully',
          provider: 'memory',
        }),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await historyService.submitFeedback('analysis-123', 'positive');

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith('/api/history/analysis-123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: 'positive' }),
      });
    });

    it('submits negative feedback successfully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          message: 'Feedback updated successfully',
        }),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await historyService.submitFeedback('analysis-123', 'negative');

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith('/api/history/analysis-123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: 'negative' }),
      });
    });

    it('handles feedback submission errors', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          success: false,
          error: 'Invalid feedback value',
        }),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await historyService.submitFeedback('analysis-123', 'positive');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid feedback value');
    });
  });
});
