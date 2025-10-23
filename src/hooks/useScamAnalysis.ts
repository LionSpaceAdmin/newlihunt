'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Message, FullAnalysisResult, UseScamAnalysisReturn } from '@/types/analysis';
import { generateMessageId } from '@/utils/helpers';

interface AnalysisConfig {
  apiUrl?: string;
  websocketUrl?: string;
  timeout?: number;
  retryAttempts?: number;
}

const DEFAULT_CONFIG: AnalysisConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  websocketUrl: undefined, // Disable WebSocket for now
  timeout: 30000, // 30 seconds
  retryAttempts: 3
};

export const useScamAnalysis = (config: AnalysisConfig = {}): UseScamAnalysisReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<FullAnalysisResult | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [storageStatus, setStorageStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');

  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (!finalConfig.websocketUrl) return;

    setConnectionStatus('connecting');
    
    try {
      const ws = new WebSocket(finalConfig.websocketUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        retryCountRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus('disconnected');
        wsRef.current = null;

        // Auto-reconnect with exponential backoff
        if (retryCountRef.current < (finalConfig.retryAttempts || 3)) {
          const delay = Math.pow(2, retryCountRef.current) * 1000;
          retryCountRef.current++;
          
          setTimeout(() => {
            connectWebSocket();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error. Please try again.');
      };

    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setConnectionStatus('disconnected');
    }
  }, [finalConfig.websocketUrl, finalConfig.retryAttempts]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'analysis_started':
        setIsLoading(true);
        setError(null);
        break;

      case 'progress':
        // Could add progress indicator here
        console.log('Analysis progress:', data.progress, data.message);
        break;

      case 'analysis_complete':
        setIsLoading(false);
        setCurrentAnalysis(data.result);
        
        // Add AI response message
        addMessage({
          role: 'assistant',
          content: data.result.summary
        });
        break;

      case 'analysis_error':
      case 'error':
        setIsLoading(false);
        setError(data.message || 'Analysis failed');
        break;

      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }, []);

  // Initialize WebSocket connection (disabled for now)
  useEffect(() => {
    // Skip WebSocket connection if URL is not provided
    if (finalConfig.websocketUrl) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [connectWebSocket, finalConfig.websocketUrl]);

  // Add message to conversation
  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: generateMessageId(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  // Send message via WebSocket (preferred) or REST API (fallback)
  const sendMessage = useCallback(async (content: string, imageUrl?: string) => {
    if (!content.trim() && !imageUrl) {
      throw new Error('Message content or image is required');
    }

    setError(null);
    
    // Add user message
    const userMessage = addMessage({
      role: 'user',
      content: content.trim(),
      imageUrl
    });

    // Use REST API directly (WebSocket disabled)
    await sendViaRestAPI(content, imageUrl);
  }, [addMessage, connectionStatus, finalConfig.timeout]);

  // REST API fallback
  const sendViaRestAPI = useCallback(async (content: string, imageUrl?: string) => {
    setIsLoading(true);

    try {
      const requestBody = {
        message: content,
        // Handle both S3 URLs and base64 data URLs
        imageUrl: imageUrl && !imageUrl.startsWith('data:') ? imageUrl : undefined,
        imageBase64: imageUrl && imageUrl.startsWith('data:') ? imageUrl.split(',')[1] : undefined,
        imageMimeType: imageUrl && imageUrl.startsWith('data:') ? imageUrl.split(';')[0].split(':')[1] : undefined,
        conversationHistory: messages.slice(-5) // Send last 5 messages for context
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
        content: result.summary
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [messages, finalConfig.apiUrl, addMessage]);

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
  const saveToHistory = useCallback(async (analysis: FullAnalysisResult) => {
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
        imageUrl: lastUserMessage.imageUrl
      };

      const response = await historyService.saveAnalysis({
        analysis,
        conversation: messages,
        input,
        processingTime: 0 // We don't track processing time in the hook currently
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
  }, [messages]);

  // Auto-save analysis when completed
  useEffect(() => {
    if (currentAnalysis) {
      saveToHistory(currentAnalysis);
    }
  }, [currentAnalysis, saveToHistory]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    messages,
    isLoading,
    error,
    currentAnalysis,
    connectionStatus,
    storageStatus,
    sendMessage,
    clearConversation,
    retryLastAnalysis,
    // Additional utilities
    addMessage,
    saveToHistory
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

  const deleteHistoryItem = useCallback(async (id: string) => {
    if (!finalConfig.apiUrl) return;

    try {
      const response = await fetch(`${finalConfig.apiUrl}/history/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setHistory(prev => prev.filter(item => item.analysisData !== undefined));
      }
    } catch (err) {
      console.error('Failed to delete history item:', err);
    }
  }, [finalConfig.apiUrl]);

  return {
    history,
    isLoadingHistory,
    historyError,
    loadHistory,
    deleteHistoryItem
  };
};

export default useScamAnalysis;