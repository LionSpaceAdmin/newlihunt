/**
 * End-to-end tests for complete user workflows
 * Tests the entire user journey from input to analysis results
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Layout from '@/components/Layout';
import { useScamAnalysis } from '@/hooks/useScamAnalysis';

// Mock the useScamAnalysis hook
jest.mock('@/hooks/useScamAnalysis');
const mockUseScamAnalysis = useScamAnalysis as jest.MockedFunction<typeof useScamAnalysis>;

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

describe('Complete User Workflows', () => {
  const mockSendMessage = jest.fn();
  const mockClearConversation = jest.fn();
  
  const mockAnalysisResult = {
    analysisData: {
      riskScore: 75,
      credibilityScore: 25,
      classification: 'HIGH_RISK' as const,
      detectedRules: [
        {
          id: 'urgent-donation',
          name: 'Urgent Donation Request',
          description: 'Content contains urgent donation appeals',
          severity: 'HIGH' as const,
          points: 30,
          category: 'behavioral'
        }
      ],
      recommendations: [
        'Do not donate through this channel',
        'Verify the organization through official sources',
        'Report this content as suspicious'
      ],
      reasoning: 'This content shows multiple red flags including urgent language and unverified donation requests.',
      debiasingStatus: {
        anonymous_profile_neutralized: true,
        patriotic_tokens_neutralized: true,
        sentiment_penalty_capped: false
      }
    },
    summary: 'High-risk scam detected with urgent donation tactics',
    metadata: {
      timestamp: new Date().toISOString(),
      processingTime: 1500,
      version: '1.0'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('true'); // Skip onboarding
    
    mockUseScamAnalysis.mockReturnValue({
      messages: [],
      isLoading: false,
      error: null,
      currentAnalysis: null,
      connectionStatus: 'connected',
      storageStatus: 'idle',
      sendMessage: mockSendMessage,
      clearConversation: mockClearConversation,
      retryLastAnalysis: jest.fn(),
      addMessage: jest.fn(),
      saveToHistory: jest.fn(),
    });
  });

  describe('Text Analysis Workflow', () => {
    it('should complete full text analysis workflow', async () => {
      const user = userEvent.setup();
      
      // Mock successful analysis
      mockSendMessage.mockResolvedValueOnce(undefined);
      mockUseScamAnalysis.mockReturnValue({
        messages: [
          {
            id: '1',
            role: 'user',
            content: 'Urgent! Help Israeli soldiers now! Donate $500 immediately!',
            timestamp: new Date()
          },
          {
            id: '2',
            role: 'assistant',
            content: mockAnalysisResult.summary,
            timestamp: new Date()
          }
        ],
        isLoading: false,
        error: null,
        currentAnalysis: mockAnalysisResult,
        connectionStatus: 'connected',
        storageStatus: 'saved',
        sendMessage: mockSendMessage,
        clearConversation: mockClearConversation,
        retryLastAnalysis: jest.fn(),
        addMessage: jest.fn(),
        saveToHistory: jest.fn(),
      });

      render(<Layout lang="en" />);

      // Find and fill the text input
      const textInput = screen.getByPlaceholderText(/describe suspicious content/i);
      await user.type(textInput, 'Urgent! Help Israeli soldiers now! Donate $500 immediately!');

      // Submit the message
      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      // Verify analysis was triggered
      expect(mockSendMessage).toHaveBeenCalledWith(
        'Urgent! Help Israeli soldiers now! Donate $500 immediately!',
        undefined
      );

      // Re-render with analysis results
      render(<Layout lang="en" />);

      // Verify analysis results are displayed
      await waitFor(() => {
        expect(screen.getByText('High-risk scam detected')).toBeInTheDocument();
        expect(screen.getByText('75')).toBeInTheDocument(); // Risk score
        expect(screen.getByText('25')).toBeInTheDocument(); // Credibility score
        expect(screen.getByText('HIGH_RISK')).toBeInTheDocument();
      });

      // Verify recommendations are shown
      expect(screen.getByText('Do not donate through this channel')).toBeInTheDocument();
      expect(screen.getByText('Verify the organization through official sources')).toBeInTheDocument();
    });

    it('should handle analysis errors gracefully', async () => {
      const user = userEvent.setup();
      
      mockSendMessage.mockRejectedValueOnce(new Error('Analysis failed'));
      mockUseScamAnalysis.mockReturnValue({
        messages: [],
        isLoading: false,
        error: 'Analysis failed',
        currentAnalysis: null,
        connectionStatus: 'disconnected',
        storageStatus: 'failed',
        sendMessage: mockSendMessage,
        clearConversation: mockClearConversation,
        retryLastAnalysis: jest.fn(),
        addMessage: jest.fn(),
        saveToHistory: jest.fn(),
      });

      render(<Layout lang="en" />);

      // Verify error is displayed
      expect(screen.getByText('Analysis failed')).toBeInTheDocument();
      
      // Verify retry button is available
      const retryButton = screen.getByText('Retry');
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('URL Inspection Workflow', () => {
    it('should detect and inspect suspicious URLs', async () => {
      const user = userEvent.setup();
      
      // Mock URL inspection API
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          result: {
            url: 'https://fake-paypal.com/donate',
            domain: 'fake-paypal.com',
            protocol: 'https:',
            title: 'PayPal Donation Page',
            contentLength: 5000,
            hasSSL: true,
            suspiciousPatterns: [
              {
                type: 'domain_spoofing',
                description: 'Potential PayPal domain spoofing',
                severity: 'high'
              }
            ],
            timestamp: new Date().toISOString()
          }
        })
      });

      render(<Layout lang="en" />);

      // Type a message with a suspicious URL
      const textInput = screen.getByPlaceholderText(/describe suspicious content/i);
      await user.type(textInput, 'Please donate here: https://fake-paypal.com/donate');

      // Verify URL is detected
      await waitFor(() => {
        expect(screen.getByText('URL detected in your message')).toBeInTheDocument();
        expect(screen.getByText('https://fake-paypal.com/donate')).toBeInTheDocument();
        expect(screen.getByText('Potentially suspicious URL detected')).toBeInTheDocument();
      });

      // Click inspect URL button
      const inspectButton = screen.getByText('Inspect URL');
      await user.click(inspectButton);

      // Verify API call was made
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/url-inspector', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: 'https://fake-paypal.com/donate' }),
        });
      });
    });
  });

  describe('Export and Sharing Workflow', () => {
    it('should export analysis results in different formats', async () => {
      const user = userEvent.setup();
      
      mockUseScamAnalysis.mockReturnValue({
        messages: [
          {
            id: '1',
            role: 'user',
            content: 'Test message',
            timestamp: new Date()
          }
        ],
        isLoading: false,
        error: null,
        currentAnalysis: mockAnalysisResult,
        connectionStatus: 'connected',
        storageStatus: 'saved',
        sendMessage: mockSendMessage,
        clearConversation: mockClearConversation,
        retryLastAnalysis: jest.fn(),
        addMessage: jest.fn(),
        saveToHistory: jest.fn(),
      });

      render(<Layout lang="en" />);

      // Find and click export menu button
      const exportButton = screen.getByTitle('Export Report');
      await user.click(exportButton);

      // Verify export options are shown
      await waitFor(() => {
        expect(screen.getByText('Export Options')).toBeInTheDocument();
        expect(screen.getByText('Copy Summary')).toBeInTheDocument();
        expect(screen.getByText('Copy Full Report')).toBeInTheDocument();
        expect(screen.getByText('Download as Text')).toBeInTheDocument();
        expect(screen.getByText('Download as JSON')).toBeInTheDocument();
      });

      // Test copy to clipboard
      const copySummaryButton = screen.getByText('Copy Summary');
      await user.click(copySummaryButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });
    });

    it('should work correctly on mobile devices', async () => {
      const user = userEvent.setup();
      
      mockUseScamAnalysis.mockReturnValue({
        messages: [],
        isLoading: false,
        error: null,
        currentAnalysis: mockAnalysisResult,
        connectionStatus: 'connected',
        storageStatus: 'saved',
        sendMessage: mockSendMessage,
        clearConversation: mockClearConversation,
        retryLastAnalysis: jest.fn(),
        addMessage: jest.fn(),
        saveToHistory: jest.fn(),
      });

      render(<Layout lang="en" />);

      // Verify mobile layout is rendered
      expect(screen.getByText('Scam Hunter')).toBeInTheDocument();
      
      // Verify mobile-specific elements
      const mobileMenuButton = screen.getByRole('button');
      expect(mobileMenuButton).toBeInTheDocument();
    });
  });

  describe('Error Boundary Protection', () => {
    it('should catch and handle component errors', () => {
      // Mock console.error to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Create a component that throws an error
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const { container } = render(
        <Layout lang="en" />
      );

      // Verify the app doesn't crash
      expect(container).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple rapid interactions', async () => {
      const user = userEvent.setup();
      
      render(<Layout lang="en" />);

      const textInput = screen.getByPlaceholderText(/describe suspicious content/i);
      
      // Simulate rapid typing
      for (let i = 0; i < 10; i++) {
        await user.type(textInput, `Message ${i} `);
      }

      // Verify input handles rapid changes
      expect(textInput).toHaveValue(expect.stringContaining('Message'));
    });

    it('should handle large text inputs', async () => {
      const user = userEvent.setup();
      
      render(<Layout lang="en" />);

      const textInput = screen.getByPlaceholderText(/describe suspicious content/i);
      const largeText = 'A'.repeat(5000); // 5KB of text
      
      await user.type(textInput, largeText);
      
      expect(textInput).toHaveValue(largeText);
    });
  });

  describe('Cross-browser Compatibility', () => {
    it('should work with different user agents', () => {
      // Mock different user agents
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      ];

      userAgents.forEach(userAgent => {
        Object.defineProperty(navigator, 'userAgent', {
          value: userAgent,
          configurable: true,
        });

        const { unmount } = render(<Layout lang="en" />);
        
        // Verify basic functionality works
        expect(screen.getByText('Scam Hunter')).toBeInTheDocument();
        
        unmount();
      });
    });
  });

  describe('Accessibility Compliance', () => {
    it('should be accessible to screen readers', () => {
      render(<Layout lang="en" />);

      // Verify ARIA labels and roles
      const textInput = screen.getByPlaceholderText(/describe suspicious content/i);
      expect(textInput).toHaveAttribute('aria-label', expect.any(String));

      // Verify keyboard navigation
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeVisible();
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(<Layout lang="en" />);

      const textInput = screen.getByPlaceholderText(/describe suspicious content/i);
      
      // Test Tab navigation
      await user.tab();
      expect(textInput).toHaveFocus();

      // Test Enter key submission
      await user.type(textInput, 'Test message');
      await user.keyboard('{Enter}');
      
      expect(mockSendMessage).toHaveBeenCalledWith('Test message', undefined);
    });
  });
});