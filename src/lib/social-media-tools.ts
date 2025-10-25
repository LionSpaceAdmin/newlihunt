/**
 * NOTE: This is a mock implementation for social media analysis tools.
 * In a real-world application, these functions would be connected to the
 * respective social media APIs (e.g., Twitter/X, Facebook, Instagram).
 */

/**
 * A mock user profile object.
 */
export interface MockUserProfile {
  username: string;
  followerCount: number;
  followingCount: number;
  accountAgeDays: number;
  bio: string;
  isVerified: boolean;
}

/**
 * A mock user post object.
 */
export interface MockUserPost {
  text: string;
  likes: number;
  retweets: number;
  timestamp: string;
}

/**
 * Mock tool to get a user's basic profile information.
 * @param username The social media username to look up.
 */
export async function getUserProfile(username: string): Promise<MockUserProfile> {
  console.log(`[Social Media Tool] Fetching profile for: ${username}`);
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 300));

  // Return mock data
  if (username.toLowerCase().includes('scam')) {
    return {
      username,
      followerCount: 12,
      followingCount: 500,
      accountAgeDays: 3,
      bio: '🌟 SUPPORT OUR TROOPS! 🌟 Click the link to donate and help our heroes! 🇺🇸 #SupportTheTroops #DonateNow',
      isVerified: false,
    };
  }

  return {
    username,
    followerCount: 2500,
    followingCount: 300,
    accountAgeDays: 1825, // 5 years
    bio: 'Official account. News and updates. For official inquiries, please visit our website.',
    isVerified: true,
  };
}

/**
 * Mock tool to get a user's recent posts.
 * @param username The social media username whose posts to fetch.
 */
export async function getRecentPosts(username: string): Promise<MockUserPost[]> {
  console.log(`[Social Media Tool] Fetching posts for: ${username}`);
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));

  // Return mock data
  if (username.toLowerCase().includes('scam')) {
    return [
      {
        text: 'Our soldiers are in desperate need of supplies! We are accepting donations via Crypto. Every bit helps! Link in bio!',
        likes: 5,
        retweets: 2,
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      },
      {
        text: 'Thank you to everyone who has donated! Your support means the world to our heroes on the front lines. #SupportOurTroops',
        likes: 8,
        retweets: 3,
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      },
    ];
  }

  return [
    {
      text: 'We are proud to announce our new community initiative. Read more on our official blog.',
      likes: 1200,
      retweets: 450,
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
    {
      text: 'Stay tuned for a major announcement tomorrow!',
      likes: 3500,
      retweets: 1200,
      timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    },
  ];
}

/**
 * Mock tool to analyze a user's follower network for bot-like activity.
 * @param username The social media username to analyze.
 */
export async function analyzeFollowerNetwork(
  username: string
): Promise<{ botFollowerPercentage: number; analysis: string }> {
  console.log(`[Social Media Tool] Analyzing follower network for: ${username}`);
  // Simulate complex analysis
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Return mock data
  if (username.toLowerCase().includes('scam')) {
    return {
      botFollowerPercentage: 85,
      analysis:
        'A high percentage of followers appear to be bots or newly created accounts with no activity, a common tactic to inflate a profile\'s perceived legitimacy.',
    };
  }

  return {
    botFollowerPercentage: 5,
    analysis: 'Follower network appears to be organic with a low percentage of suspicious accounts.',
  };
}
