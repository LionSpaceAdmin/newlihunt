import { RateLimiter } from '@/lib/middleware/rate-limiter';
import { NextRequest, NextResponse } from 'next/server';

// Rate limiter: 5 requests per minute
const socialLookupRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 60 * 1000, // 1 minute
  message: 'Too many profile lookup requests. Please wait before making another request.',
});

interface SocialLookupRequest {
  username: string;
  platform?: 'x' | 'twitter' | 'instagram' | 'facebook';
}

interface SocialLookupResponse {
  success: boolean;
  data?: {
    username: string;
    displayName: string;
    accountAge: number; // days since creation
    followerCount: number;
    followingCount: number;
    postCount: number;
    verified: boolean;
    profileImageUrl?: string;
    bio?: string;
    createdAt: string;
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SocialLookupResponse>> {
  try {
    // Apply rate limiting
    const rateLimitResult = await socialLookupRateLimiter.checkRateLimit(request);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: rateLimitResult.error || 'Rate limit exceeded. Please try again later.',
        },
        {
          status: rateLimitResult.error ? 503 : 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            ...(rateLimitResult.retryAfter && {
              'Retry-After': rateLimitResult.retryAfter.toString(),
            }),
          },
        }
      );
    }

    // Parse and validate request body
    const body: SocialLookupRequest = await request.json();

    if (!body.username || typeof body.username !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request: username is required',
        },
        { status: 400 }
      );
    }

    // Sanitize username (remove special characters, limit length)
    const sanitizedUsername = body.username.trim().replace(/[^a-zA-Z0-9_]/g, '').slice(0, 50);

    if (!sanitizedUsername) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid username format',
        },
        { status: 400 }
      );
    }

    // TODO: Integrate with external social media API
    // For now, return a mock response indicating the feature is not yet implemented
    // In production, this would call an external API like RapidAPI's social media endpoints

    // Check if API key is configured
    const apiKey = process.env.SOCIAL_MEDIA_API_KEY;
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      return NextResponse.json(
        {
          success: false,
          error: 'Social media API is not configured. Profile lookup is unavailable.',
        },
        { status: 503 }
      );
    }

    // Simulate API call with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      // In production, replace this with actual API call:
      // const response = await fetch(`https://api.example.com/profile/${sanitizedUsername}`, {
      //   headers: { 'Authorization': `Bearer ${apiKey}` },
      //   signal: controller.signal,
      // });

      // For now, return a structured error
      clearTimeout(timeoutId);
      return NextResponse.json(
        {
          success: false,
          error: 'Profile lookup feature is not yet implemented. Analysis will proceed with content only.',
        },
        { status: 200 } // Return 200 so AI can continue with content-only analysis
      );
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json(
          {
            success: false,
            error: 'Profile lookup timed out',
          },
          { status: 504 }
        );
      }

      throw error;
    }
  } catch (error) {
    console.error('Social lookup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred during profile lookup',
      },
      { status: 500 }
    );
  }
}
