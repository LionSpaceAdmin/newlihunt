import { Classification, FullAnalysisResult } from '@/types/analysis';
import { GoogleGenerativeAI, SchemaType, Tool } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const tools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'getUserProfile',
        description: "Get a user's social media profile information.",
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
        description: "Get a user's recent social media posts.",
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
        description: "Analyze a user's follower network for bot-like activity.",
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
];

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
 * Check if the input appears to be a request for analysis or just conversation
 */
function isAnalysisRequest(text: string, hasImage: boolean): boolean {
  if (hasImage) return true;
  
  const lowerText = text.toLowerCase();
  
  // Analysis indicators
  const analysisKeywords = [
    'analyze', 'check', 'scam', 'suspicious', 'fraud', 'phishing',
    'http', 'www.', '.com', '.org', '.net', '@',
    'urgent', 'donation', 'prize', 'winner', 'claim',
    'verify', 'account', 'suspended', 'click here'
  ];
  
  // Conversational indicators
  const conversationalKeywords = [
    'hi', 'hello', 'hey', 'how are you', 'thanks', 'thank you',
    'what', 'who', 'when', 'where', 'why', 'how does this work',
    'help', 'explain', 'what is', 'good morning', 'good evening'
  ];
  
  // Check for conversational patterns first
  if (conversationalKeywords.some(keyword => lowerText.includes(keyword))) {
    return false;
  }
  
  // Check for analysis patterns
  return analysisKeywords.some(keyword => lowerText.includes(keyword));
}

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
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      // Return a mock response for development/testing
      console.log('Using mock response - Gemini API key not configured');
      return {
        summary: `Hello! I'm Scam Hunter, your AI security assistant. I see you said: "${text}". To fully analyze content for scams, please configure the GEMINI_API_KEY in your environment variables. For now, I'm running in demo mode.`,
        analysisData: {
          classification: Classification.SAFE,
          riskScore: 0,
          credibilityScore: 100,
          detectedRules: [],
          recommendations: ['Configure GEMINI_API_KEY for full functionality'],
          reasoning: 'Demo mode - no actual analysis performed.',
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
    
    // Check if this is an analysis request or just conversation
    const isAnalysis = isAnalysisRequest(text, !!imageBase64);
    
    // Choose model based on request type
    const modelName = isAnalysis ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        // Only use JSON mode for analysis requests
        ...(isAnalysis && { responseMimeType: 'application/json' }),
      },
      systemInstruction: SYSTEM_PROMPT,
      // Only use tools for analysis requests
      ...(isAnalysis && { tools }),
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

    // Handle response based on whether this was an analysis request
    if (isAnalysis) {
      try {
        // Try to parse as JSON for structured analysis
        const structuredResult: FullAnalysisResult = JSON.parse(responseText);
        structuredResult.metadata = {
          ...structuredResult.metadata,
          timestamp: new Date().toISOString(),
        };
        return structuredResult;
      } catch (parseError) {
        console.warn('Failed to parse JSON response for analysis request:', parseError);
        // Fallback: treat as conversational even though it was expected to be analysis
      }
    }
    
    // Handle conversational response or fallback
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
  } catch (error) {
    console.error('Gemini API error:', error);
    // Return a generic error in case of API failure
    return {
      summary:
        'Unable to complete analysis due to a technical error. Please try again or verify content through official channels.',
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
export async function testGeminiConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      return { 
        success: false, 
        error: 'Gemini API key is not configured. Please set GEMINI_API_KEY in your environment variables.' 
      };
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Test connection. Respond with "OK".');
    const response = await result.response;
    const success = response.text().includes('OK');
    
    return { success };
  } catch (error) {
    console.error('Gemini connection test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
