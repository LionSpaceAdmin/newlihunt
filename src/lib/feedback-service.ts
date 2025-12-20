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
    // Call the feedback API endpoint
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        analysisId: feedback.analysisId,
        feedbackType: feedback.feedbackType,
        comment: feedback.comment,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to submit feedback',
      };
    }

    return data;
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
export async function getFeedbackStats(
  analysisId?: string,
  userId?: string
): Promise<{
  total: number;
  positive: number;
  negative: number;
  recent: FeedbackData[];
}> {
  try {
    const params = new URLSearchParams();
    if (analysisId) params.append('analysisId', analysisId);
    if (userId) params.append('userId', userId);

    const response = await fetch(`/api/feedback?${params.toString()}`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      return { total: 0, positive: 0, negative: 0, recent: [] };
    }

    const feedback: FeedbackData[] = data.feedback || [];
    const positive = feedback.filter((f) => f.feedbackType === 'up').length;
    const negative = feedback.filter((f) => f.feedbackType === 'down').length;
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