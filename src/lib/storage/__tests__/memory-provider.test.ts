/* eslint-disable @typescript-eslint/no-unused-vars */
import { Classification, FullAnalysisResult, Severity } from '@/types/analysis';
import { MemoryStorageProvider } from '../memory-provider';
import { StoredAnalysis, UserSession } from '../types';

describe('MemoryStorageProvider', () => {
  let provider: MemoryStorageProvider;
  let mockAnalysis: StoredAnalysis;
  let mockSession: UserSession;

  beforeEach(() => {
    provider = new MemoryStorageProvider();

    const mockResult: FullAnalysisResult = {
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

    mockAnalysis = {
      id: 'test-analysis-1',
      userId: 'test-user-1',
      timestamp: new Date('2023-10-23T14:30:00Z'),
      input: {
        message: 'Test suspicious content',
        imageUrl: 'https://example.com/image.jpg',
      },
      result: mockResult,
      conversation: [
        {
          id: 'msg1',
          role: 'user',
          content: 'Test message',
          timestamp: new Date('2023-10-23T14:29:00Z'),
        },
      ],
      metadata: {
        userAgent: 'Test User Agent',
        ipHash: 'test-ip-hash',
        processingTime: 1500,
      },
    };

    mockSession = {
      id: 'test-user-1',
      createdAt: new Date('2023-10-23T14:00:00Z'),
      lastActive: new Date('2023-10-23T14:30:00Z'),
      analysisCount: 1,
      feedbackGiven: 0,
    };
  });

  afterEach(() => {
    provider.clear();
  });
  describe('saveAnalysis', () => {
    it('saves analysis successfully', async () => {
      const id = await provider.saveAnalysis(mockAnalysis);
      expect(id).toBe(mockAnalysis.id);
      expect(provider.size()).toBe(1);
    });

    it('maintains chronological order for user analyses', async () => {
      const analysis2 = { ...mockAnalysis, id: 'test-analysis-2' };

      await provider.saveAnalysis(mockAnalysis);
      await provider.saveAnalysis(analysis2);

      const history = await provider.getUserHistory('test-user-1');
      expect(history).toHaveLength(2);
      expect(history[0].id).toBe('test-analysis-2'); // Most recent first
      expect(history[1].id).toBe('test-analysis-1');
    });
  });

  describe('getAnalysis', () => {
    it('retrieves existing analysis', async () => {
      await provider.saveAnalysis(mockAnalysis);

      const retrieved = await provider.getAnalysis('test-analysis-1');
      expect(retrieved).toEqual(mockAnalysis);
    });

    it('returns null for non-existent analysis', async () => {
      const retrieved = await provider.getAnalysis('non-existent');
      expect(retrieved).toBeNull();
    });
  });

  describe('getUserHistory', () => {
    it('returns empty array for user with no history', async () => {
      const history = await provider.getUserHistory('non-existent-user');
      expect(history).toEqual([]);
    });

    it('returns user history in chronological order', async () => {
      const analysis2 = { ...mockAnalysis, id: 'test-analysis-2', userId: 'test-user-1' };
      const analysis3 = { ...mockAnalysis, id: 'test-analysis-3', userId: 'test-user-2' };

      await provider.saveAnalysis(mockAnalysis);
      await provider.saveAnalysis(analysis2);
      await provider.saveAnalysis(analysis3);

      const history = await provider.getUserHistory('test-user-1');
      expect(history).toHaveLength(2);
      expect(history.map(a => a.id)).toEqual(['test-analysis-2', 'test-analysis-1']);
    });

    it('respects limit parameter', async () => {
      const analyses = Array.from({ length: 5 }, (_, i) => ({
        ...mockAnalysis,
        id: `test-analysis-${i}`,
        userId: 'test-user-1',
      }));

      for (const analysis of analyses) {
        await provider.saveAnalysis(analysis);
      }

      const history = await provider.getUserHistory('test-user-1', 3);
      expect(history).toHaveLength(3);
    });
  });

  describe('updateAnalysisFeedback', () => {
    it('updates feedback for existing analysis', async () => {
      await provider.saveAnalysis(mockAnalysis);

      await provider.updateAnalysisFeedback('test-analysis-1', 'positive');

      const updated = await provider.getAnalysis('test-analysis-1');
      expect(updated?.feedback).toBe('positive');
    });

    it('handles non-existent analysis gracefully', async () => {
      await expect(
        provider.updateAnalysisFeedback('non-existent', 'positive')
      ).resolves.not.toThrow();
    });
  });

  describe('session management', () => {
    it('creates new session', async () => {
      const session = await provider.createSession('test-user-1');

      expect(session.id).toBe('test-user-1');
      expect(session.analysisCount).toBe(0);
      expect(session.feedbackGiven).toBe(0);
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.lastActive).toBeInstanceOf(Date);
    });

    it('retrieves existing session', async () => {
      await provider.createSession('test-user-1');

      const retrieved = await provider.getSession('test-user-1');
      expect(retrieved?.id).toBe('test-user-1');
    });

    it('returns null for non-existent session', async () => {
      const session = await provider.getSession('non-existent');
      expect(session).toBeNull();
    });

    it('updates session with new data', async () => {
      await provider.createSession('test-user-1');

      await provider.updateSession('test-user-1', {
        analysisCount: 5,
        feedbackGiven: 2,
      });

      const updated = await provider.getSession('test-user-1');
      expect(updated?.analysisCount).toBe(5);
      expect(updated?.feedbackGiven).toBe(2);
      expect(updated?.lastActive).toBeInstanceOf(Date);
    });
  });

  describe('utility methods', () => {
    it('clears all data', async () => {
      await provider.saveAnalysis(mockAnalysis);
      await provider.createSession('test-user-1');

      expect(provider.size()).toBe(1);

      provider.clear();

      expect(provider.size()).toBe(0);
      expect(await provider.getAnalysis('test-analysis-1')).toBeNull();
      expect(await provider.getSession('test-user-1')).toBeNull();
    });

    it('reports correct size', async () => {
      expect(provider.size()).toBe(0);

      await provider.saveAnalysis(mockAnalysis);
      expect(provider.size()).toBe(1);

      const analysis2 = { ...mockAnalysis, id: 'test-analysis-2' };
      await provider.saveAnalysis(analysis2);
      expect(provider.size()).toBe(2);
    });
  });
});
