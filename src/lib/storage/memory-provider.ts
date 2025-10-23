import { StorageProvider, StoredAnalysis, UserSession } from './types';

export class MemoryStorageProvider implements StorageProvider {
  private analyses: Map<string, StoredAnalysis> = new Map();
  private sessions: Map<string, UserSession> = new Map();
  private userAnalyses: Map<string, string[]> = new Map();

  async saveAnalysis(analysis: StoredAnalysis): Promise<string> {
    this.analyses.set(analysis.id, analysis);
    
    // Update user analysis index
    const userAnalyses = this.userAnalyses.get(analysis.userId) || [];
    userAnalyses.unshift(analysis.id); // Add to beginning for chronological order
    this.userAnalyses.set(analysis.userId, userAnalyses);
    
    return analysis.id;
  }

  async getAnalysis(id: string): Promise<StoredAnalysis | null> {
    return this.analyses.get(id) || null;
  }

  async getUserHistory(userId: string, limit: number = 50): Promise<StoredAnalysis[]> {
    const analysisIds = this.userAnalyses.get(userId) || [];
    const limitedIds = analysisIds.slice(0, limit);
    
    const analyses: StoredAnalysis[] = [];
    for (const id of limitedIds) {
      const analysis = this.analyses.get(id);
      if (analysis) {
        analyses.push(analysis);
      }
    }
    
    return analyses;
  }

  async updateAnalysisFeedback(id: string, feedback: 'positive' | 'negative'): Promise<void> {
    const analysis = this.analyses.get(id);
    if (analysis) {
      analysis.feedback = feedback;
      this.analyses.set(id, analysis);
    }
  }

  async createSession(userId: string): Promise<UserSession> {
    const session: UserSession = {
      id: userId,
      createdAt: new Date(),
      lastActive: new Date(),
      analysisCount: 0,
      feedbackGiven: 0,
    };
    
    this.sessions.set(userId, session);
    return session;
  }

  async updateSession(userId: string, updates: Partial<UserSession>): Promise<void> {
    const session = this.sessions.get(userId);
    if (session) {
      Object.assign(session, updates, { lastActive: new Date() });
      this.sessions.set(userId, session);
    }
  }

  async getSession(userId: string): Promise<UserSession | null> {
    return this.sessions.get(userId) || null;
  }

  // Utility methods for testing and debugging
  clear(): void {
    this.analyses.clear();
    this.sessions.clear();
    this.userAnalyses.clear();
  }

  size(): number {
    return this.analyses.size;
  }
}