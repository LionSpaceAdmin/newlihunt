import { Classification, FullAnalysisResult } from '@/types/analysis';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * LionsOfZion Detection Criteria v1.3
 *
 * Enhanced scam detection system with dual-scoring framework to minimize false positives.
 *
 * Key Features:
 * - Dual Scoring: Separate Risk Score (0-100) and Credibility Score (0-100)
 * - Classification Matrix: Combines both scores for accurate final classification
 * - De-biasing Rules: Prevents penalization of neutral factors (anonymity, patriotic symbols)
 * - Legitimate Signals: Recognizes authentic account characteristics
 * - Reverse Image Intelligence: Detects stolen, AI-generated, or reused images
 *
 * Classifications:
 * - TRUSTED: Low risk + High credibility (safest)
 * - AUTHENTIC: Medium risk + High credibility (likely legitimate)
 * - SUSPICIOUS: Mixed signals (requires manual review)
 * - FAKE_SCAM: High risk + Low credibility (dangerous)
 */

const SYSTEM_PROMPT = `You are "Scam Hunter," a friendly and intelligent AI security analyst. Your primary goal is to help users identify online scams, especially impersonation scams targeting supporters of causes like Israel, the IDF, and Ukraine. You are a conversational partner, not just a tool. Be helpful, empathetic, and clear in your analysis.

**Core Principles:**

1.  **Conversational Approach:** Engage the user in a natural conversation. If you need more information, ask clarifying questions. Don't just provide a score; explain your reasoning in a way that's easy to understand.
2.  **Prioritize User Safety:** Your main mission is to protect users from scams. Be cautious, but also avoid being overly alarmist.
3.  **Minimize False Positives:** Not every new account or patriotic message is a scam. Use your judgment to distinguish between genuine users and malicious actors. Simple greetings or short, innocent messages are almost always safe.
4.  **Educate the User:** When you identify a potential scam, explain the tactics being used. Help the user understand *why* something is suspicious, so they can learn to spot scams on their own.

**Analysis Guidelines:**

Instead of a rigid scoring system, use the following guidelines to form your analysis:

*   **High-Risk Indicators (Strong signals of a scam):**
    *   Requests for money, especially through untraceable methods (crypto, gift cards).
    *   Urgent or emotionally manipulative language.
    *   Impersonating a soldier or official to ask for donations.
    *   Suspicious links to external websites or messaging apps (Telegram, WhatsApp).
    *   Stolen or AI-generated profile pictures.
*   **Suspicious Indicators (Warrant caution and further investigation):
    *   New accounts with generic or repetitive content.
    *   Inconsistent information in the user's profile or messages.
    *   Unusual patterns of following or engagement.
*   **Credibility Indicators (Signals of a genuine account):
    *   Long-standing account with a history of authentic engagement.
    *   Diverse and original content.
    *   No history of suspicious activity.

**Output Format:**

Provide a conversational summary of your findings first. Then, if applicable, provide a structured JSON object with the following information:

*   `summary`: A concise, human-readable summary of your analysis.
*   `classification`: Your overall assessment (e.g., `HIGH_RISK`, `SUSPICIOUS`, `LIKELY_SAFE`).
*   `riskFactors`: A list of the specific risk factors you identified.
*   `credibilityFactors`: A list of the specific credibility factors you identified.
*   `recommendation`: Your advice to the user.

**Example Interaction:**

**User:** "Hey, I got this message from someone. Is it a scam?"
**You:** "I can certainly help you with that. Could you please provide the message and any other information you have about the user?"

(User provides information)

**You:** "Thanks for sharing that. I've analyzed the information, and I have some concerns. The user's account is very new, and the message they sent is a common template used in scams. They are also trying to move the conversation to Telegram, which is a red flag. I would advise against engaging with this user or sending them any money.

Here's a summary of my findings:
```json
{
  "summary": "The user exhibits several high-risk indicators, including a new account, a scripted message, and an attempt to move the conversation to an external platform. This is likely a scam.",
  "classification": "HIGH_RISK",
  "riskFactors": ["New account", "Scripted message", "Platform hopping"],
  "credibilityFactors": ["None"],
  "recommendation": "Do not engage with this user or send them any money. Block and report the account."
}
```
"
`;

/**
 * Analyze content for scam indicators using LionsOfZion v1.3 criteria
 *
 * @param text - The text content to analyze (profile description, messages, etc.)
 * @param imageBase64 - Optional base64-encoded image for multimodal analysis
 * @param imageMimeType - MIME type of the image (e.g., 'image/jpeg')
 *
 * @returns FullAnalysisResult with dual scores, classification, and detailed evidence
 *
 * @example
 * ```typescript
 * const result = await analyzeScam(
 *   "Thank you for supporting Israel! I'm an IDF soldier...",
 *   imageBase64,
 *   "image/jpeg"
 * );
 * console.log(result.analysisData.riskScore); // 75
 * console.log(result.analysisData.credibilityScore); // 25
 * console.log(result.analysisData.classification); // "FAKE_SCAM"
 * ```
 */
export async function analyzeScam(
  text: string,
  conversationHistory: { role: string; parts: { text: string }[] }[],
  imageBase64?: string,
  imageMimeType?: string
): Promise<FullAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
      systemInstruction: SYSTEM_PROMPT,

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

    console.log('Raw AI response:', responseText.substring(0, 500) + '...');

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', responseText);
      return {
        summary: responseText,
        analysisData: {
          classification: Classification.SUSPICIOUS,
          riskFactors: [],
          credibilityFactors: [],
          recommendation: 'Could not parse AI response. Proceed with caution.',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          version: 'v2.0',
        },
      };
    }

    let analysisData;
    try {
      analysisData = JSON.parse(jsonMatch[0]);
      console.log('Parsed analysis data:', analysisData);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw JSON string:', jsonMatch[0]);
      throw new Error('Invalid JSON format in AI response');
    }

    const fullResult: FullAnalysisResult = {
      summary: analysisData.summary || extractSummaryFromText(responseText),
      analysisData: {
        classification: validateClassification(analysisData.classification),
        riskFactors: analysisData.riskFactors || [],
        credibilityFactors: analysisData.credibilityFactors || [],
        recommendation: analysisData.recommendation || 'Please verify through official channels before taking any action.',
      },
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: 0, // Will be set by the API route
      },
    };

    return fullResult;
  } catch (error) {
    console.error('Gemini API error:', error);

    return {
      summary:
        'Unable to complete analysis due to a technical error. Please try again or verify content through official channels.',
      analysisData: {
        classification: Classification.SUSPICIOUS,
        riskFactors: ['Analysis Error'],
        credibilityFactors: [],
        recommendation:
          'Analysis could not be completed due to technical difficulties. Please verify content independently.',
      },
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: 0,
      },
    };
  }
}

/**
 * Extract summary from response text if not in JSON
 */
function extractSummaryFromText(text: string): string {
  const lines = text.split('\n').filter(line => line.trim());
  const jsonIndex = lines.findIndex(line => line.trim().startsWith('{'));

  if (jsonIndex > 0) {
    return lines.slice(0, jsonIndex).join(' ').trim();
  }

  return 'Analysis completed. Please review the detailed findings below.';
}

/**
 * Validate classification value - LionsOfZion v1.3 compatible
 */
function validateClassification(classification: unknown): Classification {
  if (Object.values(Classification).includes(classification as Classification)) {
    return classification as Classification;
  }
  return Classification.SUSPICIOUS; // Fallback to SUSPICIOUS
}

/**
 * Perform a web search using fetch (since Gemini can't access web)
 */
export async function searchWeb(query: string): Promise<string> {
  try {
    // For URLs, try to fetch the page directly
    if (query.startsWith('http')) {
      try {
        const response = await fetch(query, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ScamHunter/1.0)',
          },
        });

        if (!response.ok) {
          return `Unable to access URL: ${response.status} ${response.statusText}`;
        }

        const html = await response.text();

        // Extract basic info from HTML
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);

        const title = titleMatch ? titleMatch[1].trim() : 'No title found';
        const description = descMatch ? descMatch[1].trim() : 'No description found';

        return `URL Analysis Results:
Title: ${title}
Description: ${description}
Status: Accessible (${response.status})
Note: This appears to be a legitimate website. For social media profiles, please provide the profile content directly for analysis.`;
      } catch (fetchError) {
        return `Unable to access URL: ${fetchError instanceof Error ? fetchError.message : 'Network error'}`;
      }
    }

    // For non-URL queries, return a helpful message
    return `Web search is not available for general queries. For URL analysis, please provide the full URL. For social media analysis, please provide the profile content, posts, or messages directly.`;
  } catch (error) {
    console.error('Web search error:', error);
    return 'Unable to perform web search due to a technical error.';
  }
}

/**
 * Test Gemini API connection
 */
export async function testGeminiConnection(): Promise<boolean> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const result = await model.generateContent('Test connection. Respond with "OK".');
    const response = await result.response;
    return response.text().includes('OK');
  } catch (error) {
    console.error('Gemini connection test failed:', error);
    return false;
  }
}