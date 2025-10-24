import { getAnonymousUserId } from '@/utils/helpers';

export interface UserSession {
  id: string;
  createdAt: Date;
  lastActive: Date;
  analysisCount: number;
  feedbackGiven: number;
  preferences: {
    language: 'en' | 'he';
    theme: 'dark' | 'light';
  };
}

/**
 * Get or create user session
 */
export function getUserSession(): UserSession {
  if (typeof window === 'undefined') {
    // Server-side fallback
    return {
      id: 'server-session',
      createdAt: new Date(),
      lastActive: new Date(),
      analysisCount: 0,
      feedbackGiven: 0,
      preferences: {
        language: 'en',
        theme: 'dark',
      },
    };
  }

  const userId = getAnonymousUserId();
  const sessionKey = `scam-hunter-session-${userId}`;
  
  try {
    const stored = localStorage.getItem(sessionKey);
    if (stored) {
      const session = JSON.parse(stored);
      // Update last active
      session.lastActive = new Date();
      localStorage.setItem(sessionKey, JSON.stringify(session));
      return {
        ...session,
        createdAt: new Date(session.createdAt),
        lastActive: new Date(session.lastActive),
      };
    }
  } catch (error) {
    console.error('Failed to load user session:', error);
  }

  // Create new session
  const newSession: UserSession = {
    id: userId,
    createdAt: new Date(),
    lastActive: new Date(),
    analysisCount: 0,
    feedbackGiven: 0,
    preferences: {
      language: 'en',
      theme: 'dark',
    },
  };

  try {
    localStorage.setItem(sessionKey, JSON.stringify(newSession));
  } catch (error) {
    console.error('Failed to save user session:', error);
  }

  return newSession;
}

/**
 * Update user session
 */
export function updateUserSession(updates: Partial<UserSession>): void {
  if (typeof window === 'undefined') return;

  const session = getUserSession();
  const updatedSession = {
    ...session,
    ...updates,
    lastActive: new Date(),
  };

  const sessionKey = `scam-hunter-session-${session.id}`;
  
  try {
    localStorage.setItem(sessionKey, JSON.stringify(updatedSession));
  } catch (error) {
    console.error('Failed to update user session:', error);
  }
}

/**
 * Increment analysis count
 */
export function incrementAnalysisCount(): void {
  const session = getUserSession();
  updateUserSession({
    analysisCount: session.analysisCount + 1,
  });
}

/**
 * Increment feedback count
 */
export function incrementFeedbackCount(): void {
  const session = getUserSession();
  updateUserSession({
    feedbackGiven: session.feedbackGiven + 1,
  });
}

/**
 * Clear user session
 */
export function clearUserSession(): void {
  if (typeof window === 'undefined') return;

  const userId = getAnonymousUserId();
  const sessionKey = `scam-hunter-session-${userId}`;
  
  try {
    localStorage.removeItem(sessionKey);
  } catch (error) {
    console.error('Failed to clear user session:', error);
  }
}