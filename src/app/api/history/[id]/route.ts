import { NextRequest, NextResponse } from 'next/server';
import { getStorageService } from '@/lib/storage';
import { withMiddleware, historyMiddleware, getClientIP } from '@/lib/middleware';
import { InputSanitizer, SecurityLogger } from '@/lib/middleware/security';

async function handleGET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      const ip = getClientIP(request);
      SecurityLogger.logEvent({
        type: 'invalid_input',
        severity: 'low',
        message: 'Missing analysis ID in GET request',
        ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        endpoint: `/api/history/[id]`,
      });
      
      return NextResponse.json(
        {
          success: false,
          error: 'Analysis ID is required'
        },
        { status: 400 }
      );
    }

    // Sanitize ID parameter
    const sanitizedId = InputSanitizer.sanitizeText(id, 100);

    const storageService = getStorageService();
    const analysis = await storageService.getAnalysis(sanitizedId);

    if (!analysis) {
      return NextResponse.json(
        {
          success: false,
          error: 'Analysis not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis,
      provider: storageService.getProviderType()
    });
  } catch (error) {
    console.error('Failed to retrieve analysis:', error);
    
    // Log security event
    const ip = getClientIP(request);
    SecurityLogger.logEvent({
      type: 'suspicious_activity',
      severity: 'low',
      message: `Analysis retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
      endpoint: `/api/history/[id]`,
    });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve analysis',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handlePATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { feedback }: { feedback: 'positive' | 'negative' } = body;

    if (!id) {
      const ip = getClientIP(request);
      SecurityLogger.logEvent({
        type: 'invalid_input',
        severity: 'low',
        message: 'Missing analysis ID in PATCH request',
        ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        endpoint: `/api/history/[id]`,
      });
      
      return NextResponse.json(
        {
          success: false,
          error: 'Analysis ID is required'
        },
        { status: 400 }
      );
    }

    if (!feedback || !['positive', 'negative'].includes(feedback)) {
      const ip = getClientIP(request);
      SecurityLogger.logEvent({
        type: 'invalid_input',
        severity: 'low',
        message: `Invalid feedback value: ${feedback}`,
        ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        endpoint: `/api/history/[id]`,
      });
      
      return NextResponse.json(
        {
          success: false,
          error: 'Valid feedback (positive or negative) is required'
        },
        { status: 400 }
      );
    }

    // Sanitize ID parameter
    const sanitizedId = InputSanitizer.sanitizeText(id, 100);

    const storageService = getStorageService();
    
    // Check if analysis exists
    const analysis = await storageService.getAnalysis(sanitizedId);
    if (!analysis) {
      return NextResponse.json(
        {
          success: false,
          error: 'Analysis not found'
        },
        { status: 404 }
      );
    }

    await storageService.updateAnalysisFeedback(sanitizedId, feedback);

    // Update user session feedback count
    try {
      const session = await storageService.getSession(analysis.userId);
      if (session) {
        await storageService.updateSession(analysis.userId, {
          feedbackGiven: session.feedbackGiven + 1
        });
      }
    } catch (sessionError) {
      console.warn('Failed to update session feedback count:', sessionError);
      // Don't fail the main operation if session update fails
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback updated successfully',
      provider: storageService.getProviderType()
    });
  } catch (error) {
    console.error('Failed to update feedback:', error);
    
    // Log security event
    const ip = getClientIP(request);
    SecurityLogger.logEvent({
      type: 'suspicious_activity',
      severity: 'medium',
      message: `Feedback update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
      endpoint: `/api/history/[id]`,
    });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update feedback',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Export middleware-wrapped handlers
export const GET = withMiddleware(handleGET, historyMiddleware);
export const PATCH = withMiddleware(handlePATCH, historyMiddleware);