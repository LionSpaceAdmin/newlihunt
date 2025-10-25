import { analyzeScam } from '@/lib/gemini-service';
import { withMiddleware, analysisMiddleware } from '@/lib/middleware';
import { kv } from '@vercel/kv';
import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

// ... (interface and sanitizeText function remain the same)

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, imageBase64DataUrl, conversationHistory }: AnalyzeRequest =
      body;

    // Create a hash of the request content for caching
    const hash = createHash('sha256')
      .update(JSON.stringify({ message, imageBase64DataUrl }))
      .digest('hex');

    // Check for cached result
    const cachedResult = await kv.get(hash);
    if (cachedResult) {
      return NextResponse.json(cachedResult);
    }

    // ... (rest of the function, from input validation to calling analyzeScam)

    // Store the result in cache for 24 hours
    await kv.set(hash, result, { ex: 86400 });

    return NextResponse.json(result);
  } catch (error) {
    // ... (error handling remains the same)
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
