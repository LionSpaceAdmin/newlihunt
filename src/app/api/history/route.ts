import { getHistoryService } from '@/lib/history-service';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/history - Get user's analysis history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const historyService = getHistoryService();
    const history = await historyService.getHistory(userId || undefined);

    // Limit results
    const limitedHistory = history.slice(0, limit);

    return NextResponse.json({
      success: true,
      history: limitedHistory,
      total: history.length,
    });
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

    const historyService = getHistoryService();
    const result = await historyService.saveAnalysis({
      analysis,
      conversation: conversation || [],
      input,
      processingTime: processingTime || 0,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        id: result.id,
        message: 'Analysis saved successfully',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save analysis',
          message: result.error,
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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const historyService = getHistoryService();
    const success = await historyService.clearHistory(userId || undefined);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'History cleared successfully',
      });
    } else {
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