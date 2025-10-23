/**
 * Anonymous user identification utilities
 * Creates persistent but anonymous user identifiers for session management
 */

const USER_ID_KEY = 'scam-hunt-user-id';
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export function generateUserId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `user_${timestamp}_${random}`;
}

export function getUserId(): string {
  if (typeof window === 'undefined') {
    // Server-side: generate a temporary ID
    return generateUserId();
  }

  try {
    const stored = localStorage.getItem(USER_ID_KEY);
    if (stored) {
      const { userId, timestamp } = JSON.parse(stored);
      
      // Check if the stored ID is still valid (within session duration)
      if (Date.now() - timestamp < SESSION_DURATION) {
        return userId;
      }
    }
  } catch (error) {
    console.warn('Failed to retrieve stored user ID:', error);
  }

  // Generate new user ID
  const userId = generateUserId();
  setUserId(userId);
  return userId;
}

export function setUserId(userId: string): void {
  if (typeof window === 'undefined') {
    return; // Can't set localStorage on server
  }

  try {
    const data = {
      userId,
      timestamp: Date.now()
    };
    localStorage.setItem(USER_ID_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to store user ID:', error);
  }
}

export function clearUserId(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(USER_ID_KEY);
  } catch (error) {
    console.warn('Failed to clear user ID:', error);
  }
}

export function hashIP(ip: string, salt: string = 'default-salt'): string {
  // Simple hash for privacy - this would be done server-side
  let hash = 0;
  const str = ip + salt;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 16);
}