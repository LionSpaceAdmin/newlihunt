import { Classification, FullAnalysisResult } from '@/types/analysis';
import { GoogleGenerativeAI, SchemaType, FunctionDeclaration, Tool } from '@google/generative-ai';
import {
  getUserProfile,
  getRecentPosts,
  analyzeFollowerNetwork,
} from './social-media-tools';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const tools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'getUserProfile',
        description: 'Get a user\'s social media profile information.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            username: {
              type: SchemaType.STRING,
              description: 'The username to look up.',
            },
          },
          required: ['username'],
        },
      },
      {
        name: 'getRecentPosts',
        description: 'Get a user\'s recent social media posts.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            username: {
              type: SchemaType.STRING,
              description: 'The username whose posts to fetch.',
            },
          },
          required: ['username'],
        },
      },
      {
        name: 'analyzeFollowerNetwork',
        description: 'Analyze a user\'s follower network for bot-like activity.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            username: {
              type: SchemaType.STRING,
              description: 'The username to analyze.',
            },
          },
          required: ['username'],
        },
      },
    ],
  },
  {
    googleSearchRetriever: {},
  },
];

const toolFunctions = {
  getUserProfile,
  getRecentPosts,
  analyzeFollowerNetwork,
};

const SYSTEM_PROMPT = `You are "Scam Hunter," an advanced, agentic AI security expert. Your purpose is to be a helpful conversational partner who specializes in online safety. 

**Core Principles:**

1.  **Dual Modes:** You operate in two modes: "Analysis Mode" and "Conversational Mode".
    *   **Analysis Mode:** Engage this mode when the user provides content for investigation (suspicious text, a URL, a username, an image). In this mode, you MUST use your tools and return a structured JSON object conforming to the 'FullAnalysisResult' interface.
    *   **Conversational Mode:** Engage this mode for general chat, questions, or greetings. In this mode, respond naturally with a simple, friendly string. DO NOT use the JSON format for conversational replies.

2.  **Agentic Investigation:** In Analysis Mode, use your available tools to gather intelligence. Synthesize the results into a comprehensive assessment.
3.  **Natural Conversation:** In both modes, your primary interaction style is natural and empathetic. Avoid technical jargon.
4.  **Proactive Verification:** In Analysis Mode, use your web search tool to actively verify information.
5.  **Synthesize, Don't Just List:** In Analysis Mode, explain what your findings *mean*. Don't just list raw data.
6.  **Educate and Empower:** Your goal is not just to give answers, but to help the user become more savvy about online security.

**Output Format Decision:**

*   **IF** the user's input is clearly a request for analysis (e.g., contains a URL, a username, suspicious text like "urgent donation needed", or an image is uploaded for review), **THEN** respond in the structured JSON format ('FullAnalysisResult').
*   **ELSE** (for greetings, questions like "how does this work?", or general discussion), **THEN** respond with a simple, conversational string.
`;

/**
 * Analyze content for scam indicators using the agentic tool-based approach.
 *
 * @param text - The user's prompt, which may include text to analyze or a username to investigate.
 * @param conversationHistory - The history of the conversation.
 * @param imageBase64 - Optional base64-encoded image for multimodal analysis.
 * @param imageMimeType - MIME type of the image (e.g., 'image/jpeg').
 *
 * @returns FullAnalysisResult with a conversational summary of the findings.
 */
export async function analyzeScam(
  text: string,
  conversationHistory: { role: string; parts: { text: string }[] }[],
  imageBase64?: string,
  imageMimeType?: string
): Promise<FullAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        response_mime_type: 'application/json',
      },
      systemInstruction: SYSTEM_PROMPT,
      tools,
    });

    const chat = model.startChat({ history: conversationHistory });

    const imageParts = [];
    if (imageBase64 && imageMimeType) {
      imageParts.push({
        inlineData: {
          data: imageBase64,
          mimeType: imageMimeType,
        },
      });
    }

    const result = await chat.sendMessageStream([...imageParts, { text }]);

    let responseText = '';
    for await (const chunk of result.stream) {
      responseText += chunk.text();
    }

    console.log('Raw AI response:', responseText);

    try {
      // First, try to parse as JSON for a structured analysis
      const structuredResult: FullAnalysisResult = JSON.parse(responseText);
      structuredResult.metadata = {
        ...structuredResult.metadata,
        timestamp: new Date().toISOString(),
      };
      return structuredResult;
    } catch (e) {
      // If parsing fails, it's a conversational response.
      // We create a minimal FullAnalysisResult object.
      return {
        summary: responseText, // The conversational string from the AI
        analysisData: {
          // Use default/empty values as this is not a formal analysis
          classification: Classification.SAFE, // Default to SAFE for conversations
          riskScore: 0,
          credibilityScore: 0,
          detectedRules: [],
          recommendations: [],
          reasoning: 'Conversational response, no formal analysis performed.',
          debiasingStatus: {
            anonymous_profile_neutralized: false,
            patriotic_tokens_neutralized: false,
            sentiment_penalty_capped: false,
          },
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    // Return a generic error in case of API failure
    return {
      summary: 'Unable to complete analysis due to a technical error. Please try again or verify content through official channels.',
      analysisData: {
        classification: Classification.SUSPICIOUS,
        riskFactors: ['Analysis Error'],
        credibilityFactors: [],
        riskScore: 0,
        credibilityScore: 0,
        detectedRules: [],
        recommendations: [],
        reasoning: '',
        debiasingStatus: {
          anonymous_profile_neutralized: false,
          patriotic_tokens_neutralized: false,
          sentiment_penalty_capped: false,
        },
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Test Gemini API connection
 */
export async function testGeminiConnection(): Promise<boolean> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent('Test connection. Respond with "OK".');
    const response = await result.response;
    return response.text().includes('OK');
  } catch (error) {
    console.error('Gemini connection test failed:', error);
    return false;
  }
}
