import { FullAnalysisResult, Message } from '@/types/analysis';

export interface StoredAnalysis {
  id: string;
  userId: string; // Anonymous identifier
  timestamp: Date;
  input: {
    message: string;
    imageUrl?: string;
  };
  result: FullAnalysisResult;
  conversation: Message[];
  feedback?: 'positive' | 'negative';
  metadata: {
    userAgent: string;
    ipHash: string;
    processingTime: number;
  };
}

export interface UserSession {
  id: string;
  createdAt: Date;
  lastActive: Date;
  analysisCount: number;
  feedbackGiven: number;
}

export interface StorageProvider {
  saveAnalysis(analysis: StoredAnalysis): Promise<string>;
  getAnalysis(id: string): Promise<StoredAnalysis | null>;
  getUserHistory(userId: string, limit?: number): Promise<StoredAnalysis[]>;
  updateAnalysisFeedback(id: string, feedback: 'positive' | 'negative'): Promise<void>;
  createSession(userId: string): Promise<UserSession>;
  updateSession(userId: string, updates: Partial<UserSession>): Promise<void>;
  getSession(userId: string): Promise<UserSession | null>;
}

export interface StorageConfig {
  provider: 'dynamodb' | 'memory';
  dynamodb?: {
    region: string;
    tableName: string;
    sessionTableName: string;
  };
}
