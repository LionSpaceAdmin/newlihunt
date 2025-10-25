import { analyzeWithGemini } from '@/lib/gemini-service';
import { analysisMiddleware, withMiddleware } from '@/lib/middleware';
import { Message } from '@/types/analysis';
import { kv } from '@vercel/kv';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

interface AnalyzeRequest {
  message?: string;
  imageUrl?: string;
  conversationHistory: Message[];
}

function sanitizeText(text: string): string {
  return text.trim().replace(/[\p{Cc}]/gu, '');
}

function generateCacheKey(message: string, imageHash?: string): string {
  const content = imageHash ? `${message}:${imageHash}` : message;
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  return `analysis:cache:${hash}`;
}

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, imageUrl, conversationHistory } = body as AnalyzeRequest;

    if (!message && !imageUrl) {
      return NextResponse.json({ error: 'Message or image required' }, { status: 400 });
    }

    const sanitizedMessage = sanitizeText(message || '');

    // Cache key generation (use URL instead of base64)
    const shouldCache = conversationHistory.length === 0;
    let cacheKey: string | undefined;

    if (shouldCache) {
      const cacheContent = imageUrl ? `${sanitizedMessage}:${imageUrl}` : sanitizedMessage;
      cacheKey = `analysis:cache:${crypto.createHash('sha256').update(cacheContent).digest('hex')}`;

      // Check cache
      try {
        const cachedResult = await kv.get(cacheKey);
        if (cachedResult) {
          console.log('Cache hit for analysis request');
          return NextResponse.json(cachedResult);
        }
      } catch (error) {
        console.warn('Cache read error, proceeding without cache:', error);
      }
    }

    const history = conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Fetch and convert image if URL provided
    let base64: string | undefined;
    let mimeType: string | undefined;

    if (imageUrl) {
      try {
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          return NextResponse.json({ error: 'Failed to fetch image' }, { status: 400 });
        }

        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        base64 = buffer.toString('base64');
        mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

        if (!mimeType.startsWith('image/')) {
          return NextResponse.json({ error: 'Invalid image type' }, { status: 400 });
        }
      } catch (error) {
        console.error('Image fetch error:', error);
        return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
      }
    }

    const result = await analyzeWithGemini(sanitizedMessage, history, base64, mimeType);

    // Cache the result with 5-minute TTL
    if (shouldCache && cacheKey) {
      try {
        await kv.set(cacheKey, result, { ex: 300 });
        console.log('Cached analysis result');
      } catch (error) {
        console.warn('Cache write error:', error);
      }
    }

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
