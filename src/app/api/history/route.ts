import { NextRequest, NextResponse } from 'next/server';
import { getStorageService } from '@/lib/storage';
import { getUserId } from '@/lib/user-identification';
import { StoredAnalysis } from '@/lib/storage/types';
import { FullAnalysisResult, Message } from '@/types/analysis';
import { withMiddleware, historyMiddleware, getClientIP } from '@/lib/middleware';
import { InputSanitizer, SecurityLogger } from '@/lib/middleware/security';

async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || getUserId();
    const limitParam = searchParams.get('limit') || '50';

    // Validate and sanitize limit parameter
    const limit = Math.min(Math.max(parseInt(limitParam) || 50, 1), 100); // Clamp between 1-100

    const storageService = getStorageService();
    const history = await storageService.getUserHistory(userId, limit);

    return NextResponse.json({
      success: true,
      history,
      provider: storageService.getProviderType(),
    });
  } catch (error) {
    console.error('Failed to retrieve history:', error);

    // Log security event
    const ip = getClientIP(request);
    SecurityLogger.logEvent({
      type: 'suspicious_activity',
      severity: 'low',
      message: `History retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
      endpoint: '/api/history',
    });

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

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      analysis,
      conversation,
      input,
      processingTime = 0,
    }: {
      userId?: string;
      analysis: FullAnalysisResult;
      conversation: Message[];
      input: { message: string; imageUrl?: string };
      processingTime?: number;
    } = body;

    if (!analysis || !conversation || !input) {
      const ip = getClientIP(request);
      SecurityLogger.logEvent({
        type: 'invalid_input',
        severity: 'low',
        message: 'Missing required fields in history POST request',
        ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        endpoint: '/api/history',
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: analysis, conversation, and input are required',
        },
        { status: 400 }
      );
    }

    // Validate and sanitize input message
    if (input.message) {
      try {
        input.message = InputSanitizer.sanitizeText(input.message, 10000);
      } catch (sanitizeError) {
        const ip = getClientIP(request);
        SecurityLogger.logEvent({
          type: 'invalid_input',
          severity: 'medium',
          message: `Invalid input message: ${sanitizeError instanceof Error ? sanitizeError.message : 'Unknown error'}`,
          ip,
          userAgent: request.headers.get('user-agent') || 'unknown',
          endpoint: '/api/history',
        });

        return NextResponse.json(
          {
            success: false,
            error: 'Invalid input message',
            message: sanitizeError instanceof Error ? sanitizeError.message : 'Unknown error',
          },
          { status: 400 }
        );
      }
    }

    const finalUserId = userId || getUserId();
    const userAgent = request.headers.get('user-agent') || '';
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';

    const storedAnalysis: StoredAnalysis = {
      id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: finalUserId,
      timestamp: new Date(),
      input,
      result: analysis,
      conversation,
      metadata: {
        userAgent,
        ipHash: hashIP(ip),
        processingTime,
      },
    };

    const storageService = getStorageService();
    const analysisId = await storageService.saveAnalysis(storedAnalysis);

    // Update user session
    try {
      let session = await storageService.getSession(finalUserId);
      if (!session) {
        session = await storageService.createSession(finalUserId);
      }

      await storageService.updateSession(finalUserId, {
        analysisCount: session.analysisCount + 1,
      });
    } catch (sessionError) {
      console.warn('Failed to update session:', sessionError);
      // Don't fail the main operation if session update fails
    }

    return NextResponse.json({
      success: true,
      id: analysisId,
      provider: storageService.getProviderType(),
    });
  } catch (error) {
    console.error('Failed to save analysis:', error);

    // Log security event
    const ip = getClientIP(request);
    SecurityLogger.logEvent({
      type: 'suspicious_activity',
      severity: 'medium',
      message: `Analysis save failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
      endpoint: '/api/history',
    });

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

// Export middleware-wrapped handlers
export const GET = withMiddleware(handleGET, historyMiddleware);
export const POST = withMiddleware(handlePOST, historyMiddleware);

function hashIP(ip: string): string {
  // Simple hash for privacy
  let hash = 0;
  const str = ip + (process.env.IP_SALT || 'default-salt');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 16);
}
