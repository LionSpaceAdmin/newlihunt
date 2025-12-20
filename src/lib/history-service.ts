import { FullAnalysisResult, Message } from '@/types/analysis';
import { getAnonymousUserId } from '@/utils/helpers';

export interface HistoryEntry {
  id: string;
  userId: string;
  timestamp: Date;
  analysis: FullAnalysisResult;
  conversation: Message[];
  input: {
    message: string;
    imageUrl?: string;
  };
  processingTime: number;
  userAgent?: string;
}

export interface SaveAnalysisRequest {
  analysis: FullAnalysisResult;
  conversation: Message[];
  input: {
    message: string;
    imageUrl?: string;
  };
  processingTime: number;
}

export interface SaveAnalysisResponse {
  success: boolean;
  id?: string;
  error?: string;
}

export interface HistoryService {
  saveAnalysis(request: SaveAnalysisRequest): Promise<SaveAnalysisResponse>;
  getHistory(userId?: string): Promise<HistoryEntry[]>;
  getAnalysisById(id: string): Promise<HistoryEntry | null>;
  deleteAnalysis(id: string): Promise<boolean>;
  clearHistory(userId?: string): Promise<boolean>;
}

/**
 * KV-based implementation of history service (uses API routes)
 */
class KVHistoryService implements HistoryService {
  async saveAnalysis(request: SaveAnalysisRequest): Promise<SaveAnalysisResponse> {
    try {
      const response = await fetch('/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to save analysis',
        };
      }

      return {
        success: true,
        id: data.id,
      };
    } catch (error) {
      console.error('Failed to save analysis to history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getHistory(userId?: string): Promise<HistoryEntry[]> {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);

      const response = await fetch(`/api/history?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error('Failed to get history:', data.error);
        return [];
      }

      // Convert timestamp strings back to Date objects
      const history: HistoryEntry[] = data.history.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
        conversation: entry.conversation.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }));

      return history;
    } catch (error) {
      console.error('Failed to get history:', error);
      return [];
    }
  }

  async getAnalysisById(id: string): Promise<HistoryEntry | null> {
    try {
      const response = await fetch(`/api/history/${id}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        return null;
      }

      // Convert timestamp strings back to Date objects
      const entry: HistoryEntry = {
        ...data.entry,
        timestamp: new Date(data.entry.timestamp),
        conversation: data.entry.conversation.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      };

      return entry;
    } catch (error) {
      console.error('Failed to get analysis by ID:', error);
      return null;
    }
  }

  async deleteAnalysis(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/history/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      return response.ok && data.success;
    } catch (error) {
      console.error('Failed to delete analysis:', error);
      return false;
    }
  }

  async clearHistory(userId?: string): Promise<boolean> {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);

      const response = await fetch(`/api/history?${params.toString()}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      return response.ok && data.success;
    } catch (error) {
      console.error('Failed to clear history:', error);
      return false;
    }
  }
}

/**
 * Local storage implementation of history service (legacy fallback)
 */
class LocalHistoryService implements HistoryService {
  private readonly storageKey = 'scam-hunter-history';
  private readonly maxEntries = 100;

  async saveAnalysis(request: SaveAnalysisRequest): Promise<SaveAnalysisResponse> {
    try {
      const userId = getAnonymousUserId();
      const id = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const entry: HistoryEntry = {
        id,
        userId,
        timestamp: new Date(),
        analysis: request.analysis,
        conversation: request.conversation,
        input: request.input,
        processingTime: request.processingTime,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      };

      // Get existing history
      const history = await this.getHistory();

      // Add new entry at the beginning
      history.unshift(entry);

      // Keep only the most recent entries
      if (history.length > this.maxEntries) {
        history.splice(this.maxEntries);
      }

      // Save back to storage
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(history));
      }

      return { success: true, id };
    } catch (error) {
      console.error('Failed to save analysis to history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getHistory(userId?: string): Promise<HistoryEntry[]> {
    try {
      if (typeof window === 'undefined') return [];

      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];

      const history: HistoryEntry[] = JSON.parse(stored);

      // Convert timestamp strings back to Date objects
      const processedHistory = history.map((entry) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
        conversation: entry.conversation.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }));

      // Filter by user ID if provided
      if (userId) {
        return processedHistory.filter((entry) => entry.userId === userId);
      }

      // Filter by current user
      const currentUserId = getAnonymousUserId();
      return processedHistory.filter((entry) => entry.userId === currentUserId);
    } catch (error) {
      console.error('Failed to get history:', error);
      return [];
    }
  }

  async getAnalysisById(id: string): Promise<HistoryEntry | null> {
    try {
      const history = await this.getHistory();
      return history.find((entry) => entry.id === id) || null;
    } catch (error) {
      console.error('Failed to get analysis by ID:', error);
      return null;
    }
  }

  async deleteAnalysis(id: string): Promise<boolean> {
    try {
      const history = await this.getHistory();
      const filteredHistory = history.filter((entry) => entry.id !== id);

      if (typeof window !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(filteredHistory));
      }

      return true;
    } catch (error) {
      console.error('Failed to delete analysis:', error);
      return false;
    }
  }

  async clearHistory(userId?: string): Promise<boolean> {
    try {
      if (userId) {
        // Clear history for specific user
        const allHistory = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        const filteredHistory = allHistory.filter((entry: HistoryEntry) => entry.userId !== userId);

        if (typeof window !== 'undefined') {
          localStorage.setItem(this.storageKey, JSON.stringify(filteredHistory));
        }
      } else {
        // Clear all history
        if (typeof window !== 'undefined') {
          localStorage.removeItem(this.storageKey);
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to clear history:', error);
      return false;
    }
  }
}

// Service factory
let historyService: HistoryService | null = null;

export function getHistoryService(): HistoryService {
  if (!historyService) {
    // Use KV-based service (API routes)
    historyService = new KVHistoryService();
  }

  return historyService;
}

// Export service classes for testing
export { KVHistoryService, LocalHistoryService };
