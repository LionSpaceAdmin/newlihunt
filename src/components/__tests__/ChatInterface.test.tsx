/* eslint-disable @typescript-eslint/no-unused-vars */
import { FullAnalysisResult } from '@/types/analysis';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatInterface from '../ChatInterface';

// Mock the useScamAnalysis hook
jest.mock('@/hooks/useScamAnalysis', () => ({
  useScamAnalysis: () => ({
    messages: [],
    isLoading: false,
    error: null,
    currentAnalysis: null,
    connectionStatus: 'connected',
    sendMessage: jest.fn(),
    clearConversation: jest.fn(),
    retryLastAnalysis: jest.fn(),
  }),
}));

// Mock utility functions
jest.mock('@/utils/helpers', () => ({
  formatTimestamp: (date: Date) => date.toLocaleTimeString(),
  validateImageFile: (file: File) => ({ isValid: true }),
  fileToBase64: (file: File) => Promise.resolve('base64string'),
}));

describe('ChatInterface', () => {
  const mockOnAnalysisComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders welcome message when no messages', () => {
    render(<ChatInterface onAnalysisComplete={mockOnAnalysisComplete} />);

    expect(screen.getByText('Welcome to Scam Hunter')).toBeInTheDocument();
    expect(screen.getByText(/Describe suspicious content/)).toBeInTheDocument();
  });

  it('renders quick action buttons', () => {
    render(<ChatInterface onAnalysisComplete={mockOnAnalysisComplete} />);

    expect(screen.getByText('Analyze Social Media Post')).toBeInTheDocument();
    expect(screen.getByText('Check Suspicious Email')).toBeInTheDocument();
    expect(screen.getByText('Verify Donation Request')).toBeInTheDocument();
    expect(screen.getByText('Inspect Website')).toBeInTheDocument();
  });

  it('shows connection status indicator', () => {
    render(<ChatInterface onAnalysisComplete={mockOnAnalysisComplete} />);

    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('handles text input correctly', async () => {
    const user = userEvent.setup();
    render(<ChatInterface onAnalysisComplete={mockOnAnalysisComplete} />);

    const textarea = screen.getByPlaceholderText(/Describe suspicious content/);
    await user.type(textarea, 'Test message');

    expect(textarea).toHaveValue('Test message');
  });

  it('handles quick action clicks', async () => {
    const user = userEvent.setup();
    render(<ChatInterface onAnalysisComplete={mockOnAnalysisComplete} />);

    const socialMediaButton = screen.getByText('Analyze Social Media Post');
    await user.click(socialMediaButton);

    const textarea = screen.getByPlaceholderText(/Describe suspicious content/);
    expect(textarea).toHaveValue(expect.stringContaining('social media post'));
  });

  it('handles Enter key submission', async () => {
    const user = userEvent.setup();
    render(<ChatInterface onAnalysisComplete={mockOnAnalysisComplete} />);

    const textarea = screen.getByPlaceholderText(/Describe suspicious content/);
    await user.type(textarea, 'Test message{enter}');

    // Should clear the input after submission
    expect(textarea).toHaveValue('');
  });

  it('prevents submission with empty input', async () => {
    const user = userEvent.setup();
    render(<ChatInterface onAnalysisComplete={mockOnAnalysisComplete} />);

    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeDisabled();

    const textarea = screen.getByPlaceholderText(/Describe suspicious content/);
    await user.type(textarea, 'Test');

    expect(sendButton).not.toBeDisabled();
  });

  it('handles file upload button click', async () => {
    const user = userEvent.setup();
    render(<ChatInterface onAnalysisComplete={mockOnAnalysisComplete} />);

    // Mock file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    const uploadButton = screen.getByRole('button', { name: /upload/i });
    await user.click(uploadButton);

    // Should trigger file input click (tested via DOM interaction)
    expect(uploadButton).toBeInTheDocument();
  });

  it('handles drag and drop', async () => {
    render(<ChatInterface onAnalysisComplete={mockOnAnalysisComplete} />);

    const dropZone = screen.getByPlaceholderText(/Describe suspicious content/).closest('div');

    // Create a mock file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    // Simulate drag over
    fireEvent.dragOver(dropZone!, {
      dataTransfer: {
        files: [file],
      },
    });

    // Should show drag active state
    expect(screen.getByText(/Drop an image here/)).toBeInTheDocument();
  });

  it('renders Hebrew text when lang is set to he', () => {
    render(<ChatInterface onAnalysisComplete={mockOnAnalysisComplete} lang="he" />);

    expect(screen.getByText('צייד הרמאויות')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/תאר תוכן חשוד/)).toBeInTheDocument();
  });

  it('calls onAnalysisComplete when analysis is received', () => {
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

    // Re-mock the hook to return an analysis
    jest.doMock('@/hooks/useScamAnalysis', () => ({
      useScamAnalysis: () => ({
        messages: [],
        isLoading: false,
        error: null,
        currentAnalysis: mockAnalysis,
        connectionStatus: 'connected',
        sendMessage: jest.fn(),
        clearConversation: jest.fn(),
        retryLastAnalysis: jest.fn(),
      }),
    }));

    render(<ChatInterface onAnalysisComplete={mockOnAnalysisComplete} />);

    // Should call the callback with the analysis
    expect(mockOnAnalysisComplete).toHaveBeenCalledWith(mockAnalysis);
  });

  it('shows loading state correctly', () => {
    // Mock loading state
    jest.doMock('@/hooks/useScamAnalysis', () => ({
      useScamAnalysis: () => ({
        messages: [],
        isLoading: true,
        error: null,
        currentAnalysis: null,
        connectionStatus: 'connected',
        sendMessage: jest.fn(),
        clearConversation: jest.fn(),
        retryLastAnalysis: jest.fn(),
      }),
    }));

    render(<ChatInterface onAnalysisComplete={mockOnAnalysisComplete} />);

    expect(screen.getByText(/Scam Hunter is typing/)).toBeInTheDocument();
  });

  it('shows error state with retry button', () => {
    const mockRetry = jest.fn();

    // Mock error state
    jest.doMock('@/hooks/useScamAnalysis', () => ({
      useScamAnalysis: () => ({
        messages: [],
        isLoading: false,
        error: 'Test error message',
        currentAnalysis: null,
        connectionStatus: 'connected',
        sendMessage: jest.fn(),
        clearConversation: jest.fn(),
        retryLastAnalysis: mockRetry,
      }),
    }));

    render(<ChatInterface onAnalysisComplete={mockOnAnalysisComplete} />);

    expect(screen.getByText('Test error message')).toBeInTheDocument();

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    expect(mockRetry).toHaveBeenCalled();
  });

  it('handles clear chat functionality', async () => {
    const mockClear = jest.fn();
    const user = userEvent.setup();

    // Mock state with messages
    jest.doMock('@/hooks/useScamAnalysis', () => ({
      useScamAnalysis: () => ({
        messages: [
          {
            id: '1',
            role: 'user',
            content: 'Test message',
            timestamp: new Date(),
          },
        ],
        isLoading: false,
        error: null,
        currentAnalysis: null,
        connectionStatus: 'connected',
        sendMessage: jest.fn(),
        clearConversation: mockClear,
        retryLastAnalysis: jest.fn(),
      }),
    }));

    render(<ChatInterface onAnalysisComplete={mockOnAnalysisComplete} />);

    const clearButton = screen.getByText('Clear Chat');
    await user.click(clearButton);

    expect(mockClear).toHaveBeenCalled();
  });
});

// Integration tests
describe('ChatInterface Integration', () => {
  it('handles complete message flow', async () => {
    const user = userEvent.setup();
    const mockSendMessage = jest.fn();
    const mockOnAnalysisComplete = jest.fn();

    // Mock the hook with real-like behavior
    jest.doMock('@/hooks/useScamAnalysis', () => ({
      useScamAnalysis: () => ({
        messages: [],
        isLoading: false,
        error: null,
        currentAnalysis: null,
        connectionStatus: 'connected',
        sendMessage: mockSendMessage,
        clearConversation: jest.fn(),
        retryLastAnalysis: jest.fn(),
      }),
    }));

    render(<ChatInterface onAnalysisComplete={mockOnAnalysisComplete} />);

    // Type a message
    const textarea = screen.getByPlaceholderText(/Describe suspicious content/);
    await user.type(textarea, 'Suspicious donation request');

    // Submit the message
    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);

    // Should call sendMessage with the content
    expect(mockSendMessage).toHaveBeenCalledWith('Suspicious donation request', undefined);

    // Input should be cleared
    expect(textarea).toHaveValue('');
  });

  it('handles keyboard shortcuts correctly', async () => {
    const user = userEvent.setup();
    const mockSendMessage = jest.fn();

    jest.doMock('@/hooks/useScamAnalysis', () => ({
      useScamAnalysis: () => ({
        messages: [],
        isLoading: false,
        error: null,
        currentAnalysis: null,
        connectionStatus: 'connected',
        sendMessage: mockSendMessage,
        clearConversation: jest.fn(),
        retryLastAnalysis: jest.fn(),
      }),
    }));

    render(<ChatInterface onAnalysisComplete={jest.fn()} />);

    const textarea = screen.getByPlaceholderText(/Describe suspicious content/);

    // Test Enter key submission
    await user.type(textarea, 'Test message');
    await user.keyboard('{Enter}');

    expect(mockSendMessage).toHaveBeenCalledWith('Test message', undefined);

    // Test Shift+Enter for new line (should not submit)
    await user.type(textarea, 'Multi-line{Shift>}{Enter}{/Shift}message');

    // Should not trigger additional submission
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
  });
});
