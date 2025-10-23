import { StorageProvider, StoredAnalysis, UserSession, StorageConfig } from './types';
import { MemoryStorageProvider } from './memory-provider';
import { DynamoDBStorageProvider } from './dynamodb-provider';

export class StorageService {
  private provider: StorageProvider;
  private fallbackProvider: MemoryStorageProvider;
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
    this.fallbackProvider = new MemoryStorageProvider();
    
    if (config.provider === 'dynamodb' && config.dynamodb) {
      try {
        this.provider = new DynamoDBStorageProvider(config.dynamodb);
      } catch (error) {
        console.warn('Failed to initialize DynamoDB provider, falling back to memory:', error);
        this.provider = this.fallbackProvider;
      }
    } else {
      this.provider = this.fallbackProvider;
    }
  }

  private async executeWithFallback<T>(
    operation: () => Promise<T>,
    fallbackOperation: () => Promise<T>
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.warn('Primary storage operation failed, using fallback:', error);
      return await fallbackOperation();
    }
  }

  async saveAnalysis(analysis: StoredAnalysis): Promise<string> {
    return this.executeWithFallback(
      () => this.provider.saveAnalysis(analysis),
      () => this.fallbackProvider.saveAnalysis(analysis)
    );
  }

  async getAnalysis(id: string): Promise<StoredAnalysis | null> {
    return this.executeWithFallback(
      () => this.provider.getAnalysis(id),
      () => this.fallbackProvider.getAnalysis(id)
    );
  }

  async getUserHistory(userId: string, limit?: number): Promise<StoredAnalysis[]> {
    return this.executeWithFallback(
      () => this.provider.getUserHistory(userId, limit),
      () => this.fallbackProvider.getUserHistory(userId, limit)
    );
  }

  async updateAnalysisFeedback(id: string, feedback: 'positive' | 'negative'): Promise<void> {
    return this.executeWithFallback(
      () => this.provider.updateAnalysisFeedback(id, feedback),
      () => this.fallbackProvider.updateAnalysisFeedback(id, feedback)
    );
  }

  async createSession(userId: string): Promise<UserSession> {
    return this.executeWithFallback(
      () => this.provider.createSession(userId),
      () => this.fallbackProvider.createSession(userId)
    );
  }

  async updateSession(userId: string, updates: Partial<UserSession>): Promise<void> {
    return this.executeWithFallback(
      () => this.provider.updateSession(userId, updates),
      () => this.fallbackProvider.updateSession(userId, updates)
    );
  }

  async getSession(userId: string): Promise<UserSession | null> {
    return this.executeWithFallback(
      () => this.provider.getSession(userId),
      () => this.fallbackProvider.getSession(userId)
    );
  }

  // Utility methods
  isUsingFallback(): boolean {
    return this.provider === this.fallbackProvider;
  }

  getProviderType(): 'dynamodb' | 'memory' {
    return this.isUsingFallback() ? 'memory' : this.config.provider;
  }
}

// Singleton instance for the application
let storageServiceInstance: StorageService | null = null;

export function getStorageService(): StorageService {
  if (!storageServiceInstance) {
    const config: StorageConfig = {
      provider: process.env.NODE_ENV === 'production' ? 'dynamodb' : 'memory',
      dynamodb: {
        region: process.env.AWS_REGION || 'us-east-1',
        tableName: process.env.DYNAMODB_TABLE_NAME || 'scam-hunt-history',
        sessionTableName: process.env.DYNAMODB_SESSION_TABLE_NAME || 'scam-hunt-sessions'
      }
    };
    
    storageServiceInstance = new StorageService(config);
  }
  
  return storageServiceInstance;
}

// For testing purposes
export function resetStorageService(): void {
  storageServiceInstance = null;
}