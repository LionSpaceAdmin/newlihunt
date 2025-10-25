import { analyzeWithGemini } from '@/lib/gemini-service';
import { analysisMiddleware, withMiddleware } from '@/lib/middleware';
import { Message } from '@/types/analysis';
import { NextRequest, NextResponse } from 'next/server';

interface AnalyzeRequest {
  message?: string;
  imageBase64DataUrl?: string;
  conversationHistory: Message[];
}

function sanitizeText(text: string): string {
  return text.trim().replace(/[\p{Cc}]/gu, '');
}

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, imageBase64DataUrl, conversationHistory } = body as AnalyzeRequest;

    if (!message && !imageBase64DataUrl) {
      return NextResponse.json({ error: 'Message or image required' }, { status: 400 });
    }

    const sanitizedMessage = sanitizeText(message || '');

    const history = conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    let base64: string | undefined;
    let mimeType: string | undefined;

    if (imageBase64DataUrl) {
      const parts = imageBase64DataUrl.split(',');
      if (parts.length !== 2) {
        return NextResponse.json({ error: 'Invalid image data' }, { status: 400 });
      }
      mimeType = parts[0].replace('data:', '').replace(';base64', '');
      base64 = parts[1];
      if (!mimeType.startsWith('image/')) {
        return NextResponse.json({ error: 'Invalid image type' }, { status: 400 });
      }
    }

    const result = await analyzeWithGemini(sanitizedMessage, history, base64, mimeType);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
// Handle OPTIONS for CORS
async function handleOPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Export handlers with middleware
export const POST = withMiddleware(handlePOST, analysisMiddleware);
export const OPTIONS = handleOPTIONS;
