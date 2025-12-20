import { HistoryEntry } from '@/lib/history-service';
import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/history/[id] - Get specific analysis by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing analysis ID',
        },
        { status: 400 }
      );
    }

    const userId = 'anonymous';

    try {
      // Try to get from Vercel KV
      const entry = await kv.get<HistoryEntry>(`history:${userId}:${id}`);

      if (!entry) {
        return NextResponse.json(
          {
            success: false,
            error: 'Analysis not found',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        entry,
      });
    } catch (kvError) {
      console.error('Vercel KV error:', kvError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to retrieve analysis',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Failed to get analysis:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve analysis',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/history/[id] - Delete specific analysis by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing analysis ID',
        },
        { status: 400 }
      );
    }

    const userId = 'anonymous';

    try {
      // Check if entry exists
      const entry = await kv.get(`history:${userId}:${id}`);

      if (!entry) {
        return NextResponse.json(
          {
            success: false,
            error: 'Analysis not found',
          },
          { status: 404 }
        );
      }

      // Delete from Vercel KV
      await kv.del(`history:${userId}:${id}`);

      // Remove from sorted set index
      await kv.zrem(`history:user:${userId}`, id);

      return NextResponse.json({
        success: true,
        message: 'Analysis deleted successfully',
      });
    } catch (kvError) {
      console.error('Vercel KV error:', kvError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete analysis',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Failed to delete analysis:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete analysis',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}