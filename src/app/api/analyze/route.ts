import { NextRequest, NextResponse } from 'next/server';
import { analyzeScam } from '@/lib/gemini-service';

interface AnalyzeRequest {
  message: string;
  imageBase64?: string;
  imageMimeType?: string;
  imageUrl?: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    imageUrl?: string;
  }>;
}

// Simple input sanitization
function sanitizeText(text: string, maxLength: number = 10000): string {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input: must be a non-empty string');
  }

  if (text.length > maxLength) {
    throw new Error(`Input too long: maximum ${maxLength} characters allowed`);
  }

  // Basic sanitization - remove potentially dangerous patterns
  const sanitized = text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();

  return sanitized;
}

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, imageBase64, imageMimeType, imageUrl }: AnalyzeRequest = body;

    // Validate input
    if (!message && !imageBase64 && !imageUrl) {
      console.log('Missing input parameters');
      return NextResponse.json(
        {
          success: false,
          error: 'Missing input',
          message: 'Either message text, image data, or image URL is required',
        },
        { status: 400 }
      );
    }

    // Sanitize text input
    let sanitizedMessage = '';
    if (message) {
      try {
        sanitizedMessage = sanitizeText(message, 10000);
      } catch (sanitizeError) {
        console.log('Input sanitization error:', sanitizeError);
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid input',
            message: sanitizeError instanceof Error ? sanitizeError.message : 'Unknown error',
          },
          { status: 400 }
        );
      }
    }

    // Process image data
    let processedImageBase64: string | undefined;
    let processedImageMimeType: string | undefined;

    if (imageUrl && !imageUrl.startsWith('data:')) {
      // Handle image URL (fetch and convert to base64)
      try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType?.startsWith('image/')) {
          throw new Error('Invalid image type');
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        processedImageBase64 = buffer.toString('base64');
        processedImageMimeType = contentType;
      } catch (error) {
        console.error('Failed to process image URL:', error);
        return NextResponse.json(
          {
            success: false,
            error: 'Image processing failed',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 400 }
        );
      }
    } else if (imageBase64 && imageMimeType) {
      // Use provided base64 data
      processedImageBase64 = imageBase64;
      processedImageMimeType = imageMimeType;
    }

    // Call Gemini API for analysis
    const startTime = Date.now();
    const analysisResult = await analyzeScam(
      sanitizedMessage,
      processedImageBase64,
      processedImageMimeType
    );

    // Add metadata
    const result = {
      ...analysisResult,
      metadata: {
        ...analysisResult.metadata,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        inputLength: sanitizedMessage.length,
        hasImage: !!processedImageBase64,
        version: '2.1.0',
      },
    };

    // Log successful analysis
    console.log('Analysis completed:', {
      riskScore: analysisResult.analysisData.riskScore,
      classification: analysisResult.analysisData.classification,
      detectedRulesCount: analysisResult.analysisData.detectedRules.length,
      processingTime: result.metadata.processingTime,
      hasImage: !!processedImageBase64,
      inputLength: sanitizedMessage.length,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Analysis error:', error);

    // Determine error type and status code
    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error instanceof Error) {
      if (
        error.message.includes('Invalid input') ||
        error.message.includes('Missing input') ||
        error.message.includes('Invalid image') ||
        error.message.includes('Input too long')
      ) {
        statusCode = 400;
        errorMessage = error.message;
      } else if (error.message.includes('API key') || error.message.includes('authentication')) {
        statusCode = 401;
        errorMessage = 'Authentication failed';
      } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
        statusCode = 429;
        errorMessage = 'Rate limit exceeded';
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Analysis failed',
        message: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: statusCode }
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

// Export handlers directly
export const POST = handlePOST;
export const OPTIONS = handleOPTIONS;
