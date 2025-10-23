interface FeedbackPayload {
  analysisId: string;
  feedbackType: 'up' | 'down';
  comment?: string;
}

export const submitFeedback = async (payload: FeedbackPayload) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
};
