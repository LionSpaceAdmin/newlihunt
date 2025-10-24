interface FeedbackData {
  analysisId: string;
  feedbackType: 'up' | 'down';
  comment?: string;
  userAgent?: string;
  timestamp?: string;
}

interface FeedbackResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Submit user feedback for an analysis
 */
export async function submitFeedback(feedback: FeedbackData): Promise<FeedbackResponse> {
  try {
    // Add metadata
    const feedbackWithMetadata: FeedbackData = {
      ...feedback,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
      timestamp: new Date().toISOString(),
    };

    // For now, we'll store feedback locally and log it
    // In a full implementation, this would send to an API endpoint
    if (typeof window !== 'undefined') {
      const existingFeedback = JSON.parse(
        localStorage.getItem('scam-hunter-feedback') || '[]'
      );
      
      existingFeedback.push(feedbackWithMetadata);
      
      // Keep only last 100 feedback entries
      if (existingFeedback.length > 100) {
        existingFeedback.splice(0, existingFeedback.length - 100);
      }
      
      localStorage.setItem('scam-hunter-feedback', JSON.stringify(existingFeedback));
    }

    // Log feedback for development
    console.log('Feedback submitted:', feedbackWithMetadata);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      message: 'Feedback submitted successfully',
    };
  } catch (error) {
    console.error('Failed to submit feedback:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get feedback statistics (for development/admin use)
 */
export function getFeedbackStats(): {
  total: number;
  positive: number;
  negative: number;
  recent: FeedbackData[];
} {
  if (typeof window === 'undefined') {
    return { total: 0, positive: 0, negative: 0, recent: [] };
  }

  try {
    const feedback: FeedbackData[] = JSON.parse(
      localStorage.getItem('scam-hunter-feedback') || '[]'
    );

    const positive = feedback.filter(f => f.feedbackType === 'up').length;
    const negative = feedback.filter(f => f.feedbackType === 'down').length;
    const recent = feedback.slice(-10).reverse(); // Last 10, most recent first

    return {
      total: feedback.length,
      positive,
      negative,
      recent,
    };
  } catch (error) {
    console.error('Failed to get feedback stats:', error);
    return { total: 0, positive: 0, negative: 0, recent: [] };
  }
}

/**
 * Clear all stored feedback (for development/privacy)
 */
export function clearFeedback(): boolean {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('scam-hunter-feedback');
    }
    return true;
  } catch (error) {
    console.error('Failed to clear feedback:', error);
    return false;
  }
}

/**
 * Export feedback data (for analysis/backup)
 */
export function exportFeedback(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    
    const feedback = localStorage.getItem('scam-hunter-feedback');
    return feedback;
  } catch (error) {
    console.error('Failed to export feedback:', error);
    return null;
  }
}