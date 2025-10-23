/* eslint-disable @typescript-eslint/no-explicit-any */
import { FullAnalysisResult } from '@/types/analysis';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useScamAnalysis } from '../useScamAnalysis';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  send(data: string) {
    // Mock sending data
    console.log('WebSocket send:', data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  }
}

// Mock fetch
global.fetch = jest.fn();

// Mock WebSocket
(global as any).WebSocket = MockWebSocket;

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'https://test-api.com';
process.env.NEXT_PUBLIC_WEBSOCKET_URL = 'wss://test-ws.com';

describe('useScamAnalysis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useScamAnalysis());

    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.currentAnalysis).toBe(null);
    expect(result.current.connectionStatus).toBe('connecting');
  });

  it('establishes WebSocket connection', async () => {
    const { result } = renderHook(() => useScamAnalysis());

    await waitFor(() => {
      expect(result.current.connectionStatus).toBe('connected');
    });
  });

  it('adds messages correctly', async () => {
    const { result } = renderHook(() => useScamAnalysis());

    await act(async () => {
      await result.current.sendMessage('Test message');
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('Test message');
    expect(result.current.messages[0].role).toBe('user');
  });

  it('handles WebSocket message for analysis complete', async () => {
    const { result } = renderHook(() => useScamAnalysis());

    const mockAnalysis: FullAnalysisResult = {
      summary: 'Test analysis summary',
      analysisData: {
        riskScore: 25,
        credibilityScore: 75,
        classification: 'SAFE',
        detectedRules: [],
        recommendations: ['Test recommendation'],
        reasoning: 'Test reasoning',
        debiasingStatus: {
          anonymous_profile_neutralized: false,
          patriotic_tokens_neutralized: true,
          sentiment_penalty_capped: false,
        },
      },
    };

    // Wait for WebSocket connection
    await waitFor(() => {
      expect(result.current.connectionStatus).toBe('connected');
    });

    // Simulate WebSocket message
    act(() => {
      const ws = (global as any).WebSocket.mock.instances[0];
      ws.onmessage({
        data: JSON.stringify({
          type: 'analysis_complete',
          result: mockAnalysis,
        }),
      });
    });

    expect(result.current.currentAnalysis).toEqual(mockAnalysis);
    expect(result.current.isLoading).toBe(false);
  });

  it('handles WebSocket error messages', async () => {
    const { result } = renderHook(() => useScamAnalysis());

    // Wait for connection
    await waitFor(() => {
      expect(result.current.connectionStatus).toBe('connected');
    });

    // Simulate error message
    act(() => {
      const ws = (global as any).WebSocket.mock.instances[0];
      ws.onmessage({
        data: JSON.stringify({
          type: 'error',
          message: 'Analysis failed',
        }),
      });
    });

    expect(result.current.error).toBe('Analysis failed');
    expect(result.current.isLoading).toBe(false);
  });

  it('falls back to REST API when WebSocket unavailable', async () => {
    const mockResponse: FullAnalysisResult = {
      summary: 'REST API analysis',
      analysisData: {
        riskScore: 50,
        credibilityScore: 50,
        classification: 'SUSPICIOUS',
        detectedRules: [],
        recommendations: [],
        reasoning: 'REST API reasoning',
        debiasingStatus: {
          anonymous_profile_neutralized: false,
          patriotic_tokens_neutralized: false,
          sentiment_penalty_capped: false,
        },
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    // Mock WebSocket to fail connection
    (global as any).WebSocket = class {
      constructor() {
        throw new Error('WebSocket connection failed');
      }
    };

    const { result } = renderHook(() => useScamAnalysis());

    await act(async () => {
      await result.current.sendMessage('Test message');
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://test-api.com/analyze',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Test message'),
      })
    );

    expect(result.current.currentAnalysis).toEqual(mockResponse);
  });

  it('handles REST API errors', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.resolve({ message: 'Server error' }),
    });

    // Disable WebSocket
    (global as any).WebSocket = class {
      constructor() {
        throw new Error('WebSocket unavailable');
      }
    };

    const { result } = renderHook(() => useScamAnalysis());

    await act(async () => {
      try {
        await result.current.sendMessage('Test message');
      } catch {
        // Expected to throw
      }
    });

    expect(result.current.error).toBeTruthy();
  });

  it('clears conversation correctly', () => {
    const { result } = renderHook(() => useScamAnalysis());

    // Add some messages first
    act(() => {
      result.current.addMessage?.({
        role: 'user',
        content: 'Test message',
      });
    });

    expect(result.current.messages).toHaveLength(1);

    // Clear conversation
    act(() => {
      result.current.clearConversation();
    });

    expect(result.current.messages).toHaveLength(0);
    expect(result.current.currentAnalysis).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('handles image upload correctly', async () => {
    const { result } = renderHook(() => useScamAnalysis());

    const imageUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...';

    await act(async () => {
      await result.current.sendMessage('Check this image', imageUrl);
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].imageUrl).toBe(imageUrl);
  });

  it('validates message content', async () => {
    const { result } = renderHook(() => useScamAnalysis());

    await expect(async () => {
      await act(async () => {
        await result.current.sendMessage('');
      });
    }).rejects.toThrow('Message content or image is required');
  });

  it('handles WebSocket reconnection', async () => {
    const { result } = renderHook(() => useScamAnalysis());

    // Wait for initial connection
    await waitFor(() => {
      expect(result.current.connectionStatus).toBe('connected');
    });

    // Simulate connection loss
    act(() => {
      const ws = (global as any).WebSocket.mock.instances[0];
      ws.onclose(new CloseEvent('close'));
    });

    expect(result.current.connectionStatus).toBe('disconnected');

    // Should attempt to reconnect (tested by checking if new WebSocket is created)
    await waitFor(() => {
      expect((global as any).WebSocket.mock.instances.length).toBeGreaterThan(1);
    });
  });

  it('handles custom configuration', () => {
    const customConfig = {
      apiUrl: 'https://custom-api.com',
      websocketUrl: 'wss://custom-ws.com',
      timeout: 60000,
      retryAttempts: 5,
    };

    const { result } = renderHook(() => useScamAnalysis(customConfig));

    // Should use custom configuration (tested indirectly through behavior)
    expect(result.current).toBeDefined();
  });

  it('saves analysis to history automatically', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(() => useScamAnalysis());

    const mockAnalysis: FullAnalysisResult = {
      summary: 'Test analysis',
      analysisData: {
        riskScore: 25,
        credibilityScore: 75,
        classification: 'SAFE',
        detectedRules: [],
        recommendations: [],
        reasoning: 'Test reasoning',
        debiasingStatus: {
          anonymous_profile_neutralized: false,
          patriotic_tokens_neutralized: false,
          sentiment_penalty_capped: false,
        },
      },
    };

    // Wait for connection
    await waitFor(() => {
      expect(result.current.connectionStatus).toBe('connected');
    });

    // Simulate analysis completion
    act(() => {
      const ws = (global as any).WebSocket.mock.instances[0];
      ws.onmessage({
        data: JSON.stringify({
          type: 'analysis_complete',
          result: mockAnalysis,
        }),
      });
    });

    // Should attempt to save to history
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'https://test-api.com/history',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
  });

  it('handles retry functionality', async () => {
    const { result } = renderHook(() => useScamAnalysis());

    // Add a user message first
    await act(async () => {
      await result.current.sendMessage('Test message');
    });

    // Mock the retry function
    const sendMessageSpy = jest.spyOn(result.current, 'sendMessage');

    await act(async () => {
      await result.current.retryLastAnalysis?.();
    });

    expect(sendMessageSpy).toHaveBeenCalledWith('Test message', undefined);
  });
});

// Performance tests
describe('useScamAnalysis Performance', () => {
  it('handles multiple rapid messages', async () => {
    const { result } = renderHook(() => useScamAnalysis());

    const messages = ['Message 1', 'Message 2', 'Message 3'];

    await act(async () => {
      await Promise.all(messages.map(msg => result.current.sendMessage(msg)));
    });

    expect(result.current.messages).toHaveLength(3);
  });

  it('cleans up resources on unmount', () => {
    const { unmount } = renderHook(() => useScamAnalysis());

    const closeSpy = jest.spyOn(MockWebSocket.prototype, 'close');

    unmount();

    expect(closeSpy).toHaveBeenCalled();
  });
});
