'use client';

import { FullAnalysisResult, Message, UseScamAnalysisReturn } from '@/types/analysis';
import { generateMessageId } from '@/utils/helpers';
import { useCallback, useEffect, useState } from 'react';

interface AnalysisConfig {
  apiUrl?: string;
  timeout?: number;
}

const DEFAULT_CONFIG: AnalysisConfig = {
  apiUrl: '/api', // Always use relative API path
  timeout: 30000, // 30 seconds
};

export const useScamAnalysis = (config: AnalysisConfig = {}): UseScamAnalysisReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<FullAnalysisResult | null>(null);
  const [storageStatus, setStorageStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>(
    'idle'
  );

  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: generateMessageId(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  // Send message via REST API
  const sendMessage = useCallback(
    async (content: string, imageUrl?: string) => {
      if (!content.trim() && !imageUrl) {
        throw new Error('Message content or image is required');
      }

      setError(null);

      // Add user message
      addMessage({
        role: 'user',
        content: content.trim(),
        imageUrl,
      });

      // Use REST API
      await sendViaRestAPI(content, imageUrl);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [addMessage]
  );

  // REST API implementation
  const sendViaRestAPI = useCallback(
    async (content: string, imageUrl?: string) => {
      setIsLoading(true);

      try {
        const conversationHistory = messages.map(message => ({
          role: message.role,
          parts: [{ text: message.content }],
        }));

        const requestBody = {
          message: content,
          imageBase64DataUrl: imageUrl, // Pass the full data URL
          conversationHistory: conversationHistory,
        };

        const response = await fetch(`${finalConfig.apiUrl}/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result: FullAnalysisResult = await response.json();

        setCurrentAnalysis(result);

        // Add AI response message
        addMessage({
          role: 'assistant',
          content: result.summary,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [messages, finalConfig.apiUrl, addMessage]
  );

  // Clear conversation
  const clearConversation = useCallback(() => {
    setMessages([]);
    setCurrentAnalysis(null);
    setError(null);
    setIsLoading(false);
    setStorageStatus('idle');
  }, []);

  // Retry last analysis
  const retryLastAnalysis = useCallback(async () => {
    const lastUserMessage = messages.findLast(msg => msg.role === 'user');
    if (lastUserMessage) {
      await sendMessage(lastUserMessage.content, lastUserMessage.imageUrl);
    }
  }, [messages, sendMessage]);

  // Save analysis to history using the history service
  const saveToHistory = useCallback(
    async (analysis: FullAnalysisResult) => {
      setStorageStatus('saving');

      try {
        // Import dynamically to avoid SSR issues
        const { getHistoryService } = await import('@/lib/history-service');
        const historyService = getHistoryService();

        // Find the original user input that triggered this analysis
        const lastUserMessage = messages.findLast(msg => msg.role === 'user');
        if (!lastUserMessage) {
          console.warn('No user message found for history saving');
          setStorageStatus('failed');
          return;
        }

        const input = {
          message: lastUserMessage.content,
          imageUrl: lastUserMessage.imageUrl,
        };

        const response = await historyService.saveAnalysis({
          analysis,
          conversation: messages,
          input,
          processingTime: 0, // We don't track processing time in the hook currently
        });

        if (!response.success) {
          console.error('Failed to save analysis to history:', response.error);
          setStorageStatus('failed');
        } else {
          console.log('Analysis saved to history with ID:', response.id);
          setStorageStatus('saved');
        }
      } catch (err) {
        console.error('Failed to save analysis to history:', err);
        setStorageStatus('failed');
        // Don't throw error - saving to history is not critical
      }
    },
    [messages]
  );

  // Auto-save analysis when completed
  useEffect(() => {
    if (currentAnalysis) {
      saveToHistory(currentAnalysis);
    }
  }, [currentAnalysis, saveToHistory]);

  return {
    messages,
    isLoading,
    error,
    currentAnalysis,
    storageStatus,
    sendMessage,
    clearConversation,
    retryLastAnalysis,
    // Additional utilities
    addMessage,
    saveToHistory,
  };
};

// Hook for managing analysis history
export const useAnalysisHistory = (config: AnalysisConfig = {}) => {
  const [history, setHistory] = useState<FullAnalysisResult[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const loadHistory = useCallback(async () => {
    if (!finalConfig.apiUrl) return;

    setIsLoadingHistory(true);
    setHistoryError(null);

    try {
      const response = await fetch(`${finalConfig.apiUrl}/history`);

      if (!response.ok) {
        throw new Error(`Failed to load history: ${response.statusText}`);
      }

      const data = await response.json();
      setHistory(data.history || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load history';
      setHistoryError(errorMessage);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [finalConfig.apiUrl]);

  const deleteHistoryItem = useCallback(
    async (id: string) => {
      if (!finalConfig.apiUrl) return;

      try {
        const response = await fetch(`${finalConfig.apiUrl}/history/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setHistory(prev => prev.filter(item => item.analysisData !== undefined));
        }
      } catch (err) {
        console.error('Failed to delete history item:', err);
      }
    },
    [finalConfig.apiUrl]
  );

  return {
    history,
    isLoadingHistory,
    historyError,
    loadHistory,
    deleteHistoryItem,
  };
};

export default useScamAnalysis;
