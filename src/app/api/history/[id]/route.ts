import { getHistoryService } from '@/lib/history-service';
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

    const historyService = getHistoryService();
    const analysis = await historyService.getAnalysisById(id);

    if (!analysis) {
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
      analysis,
    });
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

    const historyService = getHistoryService();
    const success = await historyService.deleteAnalysis(id);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Analysis deleted successfully',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Analysis not found or could not be deleted',
        },
        { status: 404 }
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