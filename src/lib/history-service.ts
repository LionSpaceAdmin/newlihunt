import { StoredAnalysis } from './storage/types';
import { FullAnalysisResult, Message } from '@/types/analysis';
import { getUserId } from './user-identification';

export interface SaveAnalysisRequest {
  analysis: FullAnalysisResult;
  conversation: Message[];
  input: { message: string; imageUrl?: string };
  processingTime?: number;
}

export interface HistoryResponse {
  success: boolean;
  history?: StoredAnalysis[];
  provider?: 'dynamodb' | 'memory';
  error?: string;
  message?: string;
}

export interface AnalysisResponse {
  success: boolean;
  analysis?: StoredAnalysis;
  provider?: 'dynamodb' | 'memory';
  error?: string;
  message?: string;
}

export interface SaveResponse {
  success: boolean;
  id?: string;
  provider?: 'dynamodb' | 'memory';
  error?: string;
  message?: string;
}

export class HistoryService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  async saveAnalysis(request: SaveAnalysisRequest): Promise<SaveResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          userId: getUserId(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to save analysis');
      }

      return data;
    } catch (error) {
      console.error('Failed to save analysis:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getUserHistory(limit: number = 50): Promise<HistoryResponse> {
    try {
      const userId = getUserId();
      const url = new URL(`${this.baseUrl}/history`, window.location.origin);
      url.searchParams.set('userId', userId);
      url.searchParams.set('limit', limit.toString());

      const response = await fetch(url.toString());
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to retrieve history');
      }

      return data;
    } catch (error) {
      console.error('Failed to retrieve history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getAnalysis(id: string): Promise<AnalysisResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/history/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to retrieve analysis');
      }

      return data;
    } catch (error) {
      console.error('Failed to retrieve analysis:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async submitFeedback(id: string, feedback: 'positive' | 'negative'): Promise<SaveResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/history/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to submit feedback');
      }

      return data;
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Singleton instance
let historyServiceInstance: HistoryService | null = null;

export function getHistoryService(): HistoryService {
  if (!historyServiceInstance) {
    historyServiceInstance = new HistoryService();
  }
  return historyServiceInstance;
}

// For testing purposes
export function resetHistoryService(): void {
  historyServiceInstance = null;
}
