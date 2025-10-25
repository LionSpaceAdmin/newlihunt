import { testGeminiConnection } from '@/lib/gemini-service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await testGeminiConnection();

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? 'Gemini API connection successful'
        : `Gemini API connection failed: ${result.error}`,
      timestamp: new Date().toISOString(),
      apiKeyConfigured: !!(
        process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE'
      ),
      apiKeyValue: process.env.GEMINI_API_KEY
        ? `${process.env.GEMINI_API_KEY.substring(0, 10)}...`
        : 'Not set',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
