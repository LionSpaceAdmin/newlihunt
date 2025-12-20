import { HistoryEntry } from '@/lib/history-service';
import { RateLimiter } from '@/lib/middleware/rate-limiter';
import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

// Rate limiter: 20 requests per minute
const historyRateLimiter = new RateLimiter({
  maxRequests: 20,
  windowMs: 60 * 1000,
  message: 'Too many history requests. Please wait before making more requests.',
});

// GET /api/history - Get user's analysis history
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await historyRateLimiter.checkRateLimit(request);

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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'anonymous';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    try {
      // Get history IDs from sorted set (sorted by timestamp)
      // zrange with rev option returns in descending order (most recent first)
      const historyIds = await kv.zrange(`history:user:${userId}`, offset, offset + limit - 1, {
        rev: true,
      });

      if (!historyIds || historyIds.length === 0) {
        return NextResponse.json({
          success: true,
          history: [],
          total: 0,
        });
      }

      // Get full history entries
      const historyEntries = await Promise.all(
        historyIds.map(async (id) => {
          const entry = await kv.get<HistoryEntry>(`history:${userId}:${id}`);
          return entry;
        })
      );

      // Filter out null values
      const validHistory = historyEntries.filter((entry) => entry !== null);

      // Get total count
      const total = await kv.zcard(`history:user:${userId}`);

      return NextResponse.json({
        success: true,
        history: validHistory,
        total: total || 0,
      });
    } catch (kvError) {
      console.error('Vercel KV error:', kvError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to retrieve history',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Failed to get history:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve history',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/history - Save new analysis to history
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await historyRateLimiter.checkRateLimit(request);

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

    const body = await request.json();
    const { analysis, conversation, input, processingTime } = body;

    if (!analysis || !input) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'Analysis and input are required',
        },
        { status: 400 }
      );
    }

    // Get userId - generate one for anonymous users
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const id = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const entry: HistoryEntry = {
      id,
      userId,
      timestamp: new Date(timestamp),
      analysis,
      conversation: conversation || [],
      input,
      processingTime: processingTime || 0,
      userAgent,
    };

    try {
      // Store in Vercel KV
      // Key structure: history:{userId}:{analysisId}
      await kv.set(`history:${userId}:${id}`, entry);

      // Add to sorted set index (score = timestamp for sorting)
      const timestampScore = new Date(timestamp).getTime();
      await kv.zadd(`history:user:${userId}`, { score: timestampScore, member: id });

      return NextResponse.json({
        success: true,
        id,
        message: 'Analysis saved successfully',
      });
    } catch (kvError) {
      console.error('Vercel KV error:', kvError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save analysis',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Failed to save analysis:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save analysis',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/history - Clear user's history
export async function DELETE(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await historyRateLimiter.checkRateLimit(request);

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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'anonymous';

    try {
      // Get all history IDs for the user
      const historyIds = await kv.zrange(`history:user:${userId}`, 0, -1);

      if (historyIds && historyIds.length > 0) {
        // Delete all history entries
        const deletePromises = historyIds.map((id) => kv.del(`history:${userId}:${id}`));
        await Promise.all(deletePromises);
      }

      // Delete the sorted set index
      await kv.del(`history:user:${userId}`);

      return NextResponse.json({
        success: true,
        message: 'History cleared successfully',
      });
    } catch (kvError) {
      console.error('Vercel KV error:', kvError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to clear history',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Failed to clear history:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear history',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}