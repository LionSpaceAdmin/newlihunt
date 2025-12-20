import { RateLimiter } from '@/lib/middleware/rate-limiter';
import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

// Rate limiter: 10 feedback submissions per minute
const feedbackRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000,
  message: 'Too many feedback submissions. Please wait before submitting more feedback.',
});

interface FeedbackRequest {
  analysisId: string;
  feedbackType: 'up' | 'down';
  comment?: string;
}

interface FeedbackData {
  analysisId: string;
  userId: string;
  feedbackType: 'up' | 'down';
  comment?: string;
  userAgent: string;
  timestamp: string;
}

interface FeedbackResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<FeedbackResponse>> {
  try {
    // Apply rate limiting
    const rateLimitResult = await feedbackRateLimiter.checkRateLimit(request);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: rateLimitResult.error || 'Rate limit exceeded',
        },
        {
          status: rateLimitResult.error ? 503 : 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            ...(rateLimitResult.retryAfter && {
              'Retry-After': rateLimitResult.retryAfter.toString(),
            }),
          },
        }
      );
    }

    // Parse and validate request body
    const body: FeedbackRequest = await request.json();

    if (!body.analysisId || !body.feedbackType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request: analysisId and feedbackType are required',
        },
        { status: 400 }
      );
    }

    if (body.feedbackType !== 'up' && body.feedbackType !== 'down') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid feedbackType: must be "up" or "down"',
        },
        { status: 400 }
      );
    }

    // Get user ID - generate one for anonymous users
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create feedback data
    const feedbackData: FeedbackData = {
      analysisId: body.analysisId,
      userId,
      feedbackType: body.feedbackType,
      comment: body.comment,
      userAgent,
      timestamp,
    };

    // Store in Vercel KV
    // Key structure: feedback:{analysisId}:{userId}:{timestamp}
    const feedbackKey = `feedback:${body.analysisId}:${userId}:${Date.now()}`;

    try {
      await kv.set(feedbackKey, feedbackData);

      // Add to indexes for efficient querying
      // Index by analysisId
      await kv.sadd(`feedback:index:${body.analysisId}`, feedbackKey);

      // Index by userId
      await kv.sadd(`feedback:user:${userId}`, feedbackKey);

      return NextResponse.json({
        success: true,
        message: 'Feedback submitted successfully',
      });
    } catch (kvError) {
      console.error('Vercel KV error:', kvError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save feedback. Please try again.',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while submitting feedback',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve feedback
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('analysisId');
    const userId = searchParams.get('userId');

    if (!analysisId && !userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either analysisId or userId parameter is required',
        },
        { status: 400 }
      );
    }

    try {
      let feedbackKeys: string[] = [];

      if (analysisId) {
        // Get feedback for specific analysis
        feedbackKeys = await kv.smembers(`feedback:index:${analysisId}`);
      } else if (userId) {
        // Get feedback from specific user
        feedbackKeys = await kv.smembers(`feedback:user:${userId}`);
      }

      // Retrieve feedback data
      const feedbackData = await Promise.all(
        feedbackKeys.map(async (key) => {
          const data = await kv.get<FeedbackData>(key);
          return data;
        })
      );

      // Filter out null values
      const validFeedback = feedbackData.filter((f) => f !== null);

      return NextResponse.json({
        success: true,
        feedback: validFeedback,
        count: validFeedback.length,
      });
    } catch (kvError) {
      console.error('Vercel KV error:', kvError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to retrieve feedback',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Feedback GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while retrieving feedback',
      },
      { status: 500 }
    );
  }
}
