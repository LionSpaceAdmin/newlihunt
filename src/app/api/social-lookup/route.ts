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

    // --- Mock Social Media API Implementation ---
    // In a real application, this would be a call to an external service.
    // For this project, we simulate the API to make the AI tool functional.

    const mockDatabase: { [key: string]: SocialLookupResponse['data'] } = {
      very_suspicious_user: {
        username: 'very_suspicious_user',
        displayName: '💎 CryptoKing 💎',
        accountAge: 15, // days
        followerCount: 5000,
        followingCount: 4998,
        postCount: 20,
        verified: false,
        bio: '💰 FREE CRYPTO airdrop! 🚀 DM me to get rich FAST! Limited spots! #crypto #makemoney #freedom',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
      normal_user_dan: {
        username: 'normal_user_dan',
        displayName: 'Daniel',
        accountAge: 730, // 2 years
        followerCount: 250,
        followingCount: 300,
        postCount: 150,
        verified: false,
        bio: 'Tech enthusiast, loves hiking and dogs. All opinions are my own.',
        createdAt: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString(),
      },
      celebrity_idf_fan: {
        username: 'celebrity_idf_fan',
        displayName: 'Gal Gadot',
        accountAge: 3650, // 10 years
        followerCount: 109000000,
        followingCount: 500,
        postCount: 1200,
        verified: true,
        profileImageUrl: 'https://example.com/gal_gadot_profile.jpg',
        bio: 'I stand with the IDF. Let there be peace. ❤️',
        createdAt: new Date(Date.now() - 3650 * 24 * 60 * 60 * 1000).toISOString(),
      },
      business_account_tech: {
        username: 'business_account_tech',
        displayName: 'CyberGuard Solutions',
        accountAge: 1825, // 5 years
        followerCount: 150000,
        followingCount: 150,
        postCount: 2500,
        verified: true,
        bio: 'Leading the future of cybersecurity. Protecting your digital assets with cutting-edge AI technology. #cybersecurity #AI',
        createdAt: new Date(Date.now() - 1825 * 24 * 60 * 60 * 1000).toISOString(),
      },
    };

    const profileData = mockDatabase[sanitizedUsername];

    if (profileData) {
      return NextResponse.json({
        success: true,
        data: profileData,
      });
    } else {
      // If user is not in our mock DB, return success but with no data
      // This simulates a "user not found" scenario, which is not an error.
      return NextResponse.json({
        success: true,
        data: undefined,
      });
    }
    // --- End of Mock API Implementation ---

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
