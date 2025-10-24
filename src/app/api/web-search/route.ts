
import { NextRequest, NextResponse } from 'next/server';
import { searchWeb } from '@/lib/gemini-service';

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const searchResults = await searchWeb(query);

    return NextResponse.json({ results: searchResults });
  } catch (error) {
    console.error('Error in web search API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
