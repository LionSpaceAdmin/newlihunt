import { StorageService, resetStorageService } from '../storage-service';
import { MemoryStorageProvider } from '../memory-provider';
import { StorageConfig, StoredAnalysis } from '../types';
import { FullAnalysisResult, Classification, Severity } from '@/types/analysis';

// Mock the DynamoDB provider to simulate failures
jest.mock('../dynamodb-provider', () => ({
  DynamoDBStorageProvider: jest.fn().mockImplementation(() => {
    throw new Error('DynamoDB initialization failed');
  })
}));

describe('StorageService', () => {
  let mockAnalysis: StoredAnalysis;

  beforeEach(() => {
    resetStorageService();
    
    const mockResult: FullAnalysisResult = {
      summary: 'Test analysis summary',
      analysisData: {
        riskScore: 75,
        credibilityScore: 25,
        classification: Classification.SUSPICIOUS,
        detectedRules: [{
          id: 'rule1',
          name: 'Test Rule',
          severity: Severity.MEDIUM,
          description: 'Test rule description',
          points: 10
        }],
        recommendations: ['Test recommendation'],
        reasoning: 'Test reasoning',
        debiasingStatus: {
          anonymous_profile_neutralized: true,
          patriotic_tokens_neutralized: false,
          sentiment_penalty_capped: true
        }
      }
    };

    mockAnalysis = {
      id: 'test-analysis-1',
      userId: 'test-user-1',
      timestamp: new Date('2023-10-23T14:30:00Z'),
      input: {
        message: 'Test suspicious content'
      },
      result: mockResult,
      conversation: [],
      metadata: {
        userAgent: 'Test User Agent',
        ipHash: 'test-ip-hash',
        processingTime: 1500
      }
    };
  });

  describe('initialization', () => {
    it('falls back to memory provider when DynamoDB fails', () => {
      const config: StorageConfig = {
        provider: 'dynamodb',
        dynamodb: {
          region: 'us-east-1',
          tableName: 'test-table',
          sessionTableName: 'test-sessions'
        }
      };

      const service = new StorageService(config);
      expect(service.isUsingFallback()).toBe(true);
      expect(service.getProviderType()).toBe('memory');
    });

    it('uses memory provider when configured', () => {
      const config: StorageConfig = {
        provider: 'memory'
      };

      const service = new StorageService(config);
      expect(service.getProviderType()).toBe('memory');
    });
  });

  describe('fallback mechanism', () => {
    it('executes operations with fallback on primary failure', async () => {
      const config: StorageConfig = { provider: 'memory' };
      const service = new StorageService(config);

      // Mock the primary provider to fail
      const mockProvider = {
        saveAnalysis: jest.fn().mockRejectedValue(new Error('Primary failed')),
        getAnalysis: jest.fn().mockRejectedValue(new Error('Primary failed')),
        getUserHistory: jest.fn().mockRejectedValue(new Error('Primary failed')),
        updateAnalysisFeedback: jest.fn().mockRejectedValue(new Error('Primary failed')),
        createSession: jest.fn().mockRejectedValue(new Error('Primary failed')),
        updateSession: jest.fn().mockRejectedValue(new Error('Primary failed')),
        getSession: jest.fn().mockRejectedValue(new Error('Primary failed'))
      };

      // Replace the provider with our mock
      (service as any).provider = mockProvider;

      // Test that fallback is used
      const id = await service.saveAnalysis(mockAnalysis);
      expect(id).toBe(mockAnalysis.id);
      expect(mockProvider.saveAnalysis).toHaveBeenCalled();
    });

    it('handles successful primary operations', async () => {
      const config: StorageConfig = { provider: 'memory' };
      const service = new StorageService(config);

      const id = await service.saveAnalysis(mockAnalysis);
      expect(id).toBe(mockAnalysis.id);

      const retrieved = await service.getAnalysis(mockAnalysis.id);
      expect(retrieved).toEqual(mockAnalysis);
    });
  });

  describe('analysis operations', () => {
    let service: StorageService;

    beforeEach(() => {
      const config: StorageConfig = { provider: 'memory' };
      service = new StorageService(config);
    });

    it('saves and retrieves analysis', async () => {
      const id = await service.saveAnalysis(mockAnalysis);
      expect(id).toBe(mockAnalysis.id);

      const retrieved = await service.getAnalysis(id);
      expect(retrieved).toEqual(mockAnalysis);
    });

    it('gets user history', async () => {
      await service.saveAnalysis(mockAnalysis);
      
      const history = await service.getUserHistory('test-user-1');
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(mockAnalysis);
    });

    it('updates analysis feedback', async () => {
      await service.saveAnalysis(mockAnalysis);
      
      await service.updateAnalysisFeedback(mockAnalysis.id, 'positive');
      
      const updated = await service.getAnalysis(mockAnalysis.id);
      expect(updated?.feedback).toBe('positive');
    });
  });

  describe('session operations', () => {
    let service: StorageService;

    beforeEach(() => {
      const config: StorageConfig = { provider: 'memory' };
      service = new StorageService(config);
    });

    it('creates and retrieves session', async () => {
      const session = await service.createSession('test-user-1');
      expect(session.id).toBe('test-user-1');

      const retrieved = await service.getSession('test-user-1');
      expect(retrieved?.id).toBe('test-user-1');
    });

    it('updates session', async () => {
      await service.createSession('test-user-1');
      
      await service.updateSession('test-user-1', {
        analysisCount: 5,
        feedbackGiven: 2
      });
      
      const updated = await service.getSession('test-user-1');
      expect(updated?.analysisCount).toBe(5);
      expect(updated?.feedbackGiven).toBe(2);
    });
  });
});