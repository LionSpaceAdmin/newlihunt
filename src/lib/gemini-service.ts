import { GoogleGenAI, Type, Chat, GenerateContentResponse, Part } from "@google/genai";
import { FullAnalysisResult } from '@/types/analysis';

// Initialize Gemini AI client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable not set");
  }
  
  return new GoogleGenAI({ apiKey });
};

const analysisSystemInstruction = `You are Scam Hunter, an expert AI analyst specializing in detecting online impersonation scams targeting supporters of Israel and the IDF, following specific v2 protocols.

**Analysis Protocol:**
1. **Dual-Score Framework**: Provide a Risk Score (0-100) and a Credibility Score (0-100). Classify as SAFE, SUSPICIOUS, or HIGH_RISK.
2. **Contributors**: Identify the top factors (Detected Rules) that increase risk (positive points) and those that increase credibility (negative points).
3. **Debiasing**: You MUST evaluate and report on the debiasing status. Anonymity and patriotic tokens are not risk signals by themselves. Report "true" if neutralization was applied.
4. **Safe Donation Protocol**: CRITICAL - ONLY recommend officially verified channels like FIDF.org.

**Response Format:**
First, provide a natural, conversational summary.
Then, you MUST provide the structured JSON analysis. The entire response must be a valid JSON object matching the provided schema, including the 'debiasingStatus' object.`;

const analysisResponseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "A natural, helpful explanation of the analysis in a conversational tone. Include a summary of findings, key concerns, actionable recommendations, and educational insights about scam tactics.",
    },
    analysisData: {
      type: Type.OBJECT,
      properties: {
        riskScore: { type: Type.NUMBER, description: "Likelihood of scam/fraud (0-100)" },
        credibilityScore: { type: Type.NUMBER, description: "Trustworthiness assessment (0-100)" },
        classification: { type: Type.STRING, enum: ["SAFE", "SUSPICIOUS", "HIGH_RISK"] },
        detectedRules: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              severity: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
              description: { type: Type.STRING },
              points: { type: Type.NUMBER }
            },
            required: ["id", "name", "severity", "description", "points"]
          }
        },
        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
        reasoning: { type: Type.STRING, description: "Detailed explanation of the analysis and scoring" },
        debiasingStatus: {
          type: Type.OBJECT,
          properties: {
            anonymous_profile_neutralized: { type: Type.BOOLEAN },
            patriotic_tokens_neutralized: { type: Type.BOOLEAN },
            sentiment_penalty_capped: { type: Type.BOOLEAN }
          },
          required: ["anonymous_profile_neutralized", "patriotic_tokens_neutralized", "sentiment_penalty_capped"]
        }
      },
      required: ["riskScore", "credibilityScore", "classification", "detectedRules", "recommendations", "reasoning", "debiasingStatus"]
    }
  },
  required: ["summary", "analysisData"]
};

export const analyzeScam = async (text: string, imageBase64?: string, imageMimeType?: string): Promise<FullAnalysisResult> => {
  const startTime = Date.now();
  const ai = getGeminiClient();
  
  const contents: Part[] = [{ text: `Analyze the following content for impersonation scams. URL/Handle: ${text}` }];
  
  if (imageBase64 && imageMimeType) {
    contents.unshift({
      inlineData: {
        data: imageBase64,
        mimeType: imageMimeType,
      },
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: [{ parts: contents }],
    config: {
      systemInstruction: analysisSystemInstruction,
      responseMimeType: "application/json",
      responseSchema: analysisResponseSchema,
      thinkingConfig: { thinkingBudget: 32768 },
    },
  });

  const jsonText = response.text?.trim();
  if (!jsonText) {
    throw new Error('No response text received from Gemini API');
  }
  const parsedResult = JSON.parse(jsonText);
  
  // Add metadata if not present
  const result: FullAnalysisResult = {
    ...parsedResult,
    metadata: parsedResult.metadata || {
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      version: '1.0'
    }
  };
  
  return result;
};

let chatInstance: Chat | null = null;

export const getChatInstance = (): Chat => {
  if (!chatInstance) {
    const ai = getGeminiClient();
    chatInstance = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: "You are a helpful assistant for the Scam Hunt Platform. Answer user questions concisely and clearly.",
      }
    });
  }
  return chatInstance;
};

export const sendMessageToBot = async (chat: Chat, message: string): Promise<GenerateContentResponse> => {
  return chat.sendMessage({ message });
};

export const groundedSearch = async (query: string): Promise<{ text: string; sources: any[] }> => {
  const ai = getGeminiClient();
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: query,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text || '';
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return { text, sources };
};