export enum Classification {
  SAFE = 'SAFE',
  SUSPICIOUS = 'SUSPICIOUS',
  HIGH_RISK = 'HIGH_RISK',
  // LionsOfZion v1.3 - New classifications from matrix
  TRUSTED = 'TRUSTED', // Low risk + High credibility
  AUTHENTIC = 'AUTHENTIC', // Medium risk + High credibility
  FAKE_SCAM = 'FAKE_SCAM', // High risk + Low credibility (alias for HIGH_RISK)
}

export enum Severity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface DetectedRule {
  id: string;
  name: string;
  severity: Severity;
  description: string;
  points: number; // Positive for risk, negative for credibility
  category?: 'Legitimate' | 'Suspicious' | 'Fake'; // LionsOfZion v1.3 - Signal categorization
  imageIntelligence?: {
    // Optional field for reverse image search findings
    isStolen?: boolean;
    isAIGenerated?: boolean;
    isReused?: boolean;
    source?: string;
  };
}

export interface DebiasingStatus {
  anonymous_profile_neutralized: boolean;
  patriotic_tokens_neutralized: boolean;
  sentiment_penalty_capped: boolean;
}

export interface AnalysisData {
  riskScore: number;
  credibilityScore: number;
  classification: Classification;
  detectedRules: DetectedRule[];
  recommendations: string[];
  reasoning: string;
  debiasingStatus: DebiasingStatus;
}

export interface AnalysisMetadata {
  timestamp: string;
  processingTime?: number;
  version?: string;
}

export interface FullAnalysisResult {
  summary: string;
  analysisData: AnalysisData;
  metadata: AnalysisMetadata;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
}

export interface ChatInterfaceProps {
  onAnalysisComplete: (analysis: FullAnalysisResult) => void;
}

export interface UseScamAnalysisReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  currentAnalysis: FullAnalysisResult | null;
  connectionStatus?: 'disconnected' | 'connecting' | 'connected';
  storageStatus?: 'idle' | 'saving' | 'saved' | 'failed';
  sendMessage: (content: string, imageUrl?: string) => Promise<void>;
  clearConversation: () => void;
  retryLastAnalysis?: () => Promise<void>;
  addMessage?: (message: Omit<Message, 'id' | 'timestamp'>) => Message;
  saveToHistory?: (analysis: FullAnalysisResult) => Promise<void>;
}
