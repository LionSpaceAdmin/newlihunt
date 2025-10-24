import { Classification, DetectedRule, FullAnalysisResult, Severity } from '@/types/analysis';
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

// System prompt for scam analysis - LionsOfZion Detection Criteria v1.3
const SYSTEM_PROMPT = `You are "Scam Hunter," an expert AI analyst specializing in detecting online impersonation scams, particularly those targeting supporters of Israel and the IDF (and similar scams targeting Ukrainian supporters). Your mission is to protect people from fraudulent donation requests and fake accounts while minimizing false positives against legitimate users.

LIONSOFZION DETECTION CRITERIA v1.3

ANALYSIS FRAMEWORK:
You must provide both a Risk Score (0-100) and Credibility Score (0-100):
- Risk Score: Sum of scam indicator points (higher = more dangerous)
- Credibility Score: Sum of legitimacy indicator points (higher = more trustworthy)

✅ LEGITIMATE / AUTHENTIC SIGNALS (Boost Credibility Score):
These signals indicate a genuine account and should INCREASE the Credibility Score:

1. Significant account age (pre-2023 or consistent long-term activity): +10 points
2. Steady, natural posting cadence (not bursts): +8 points
3. Content diversity (posts, replies, visuals, tone variety): +8 points
4. No donation/crypto/"DM for help" requests: +10 points
5. Genuine interactions with trusted/verified Israeli accounts: +6 points
6. Natural language (not templated/repetitive): +6 points
7. Internal consistency (name, tone, community): +6 points
8. No redirection to external apps/links: +6 points
9. Image Check - Unique/original media (not AI/reused): +10 points

⚠️ SUSPICIOUS SIGNALS (Moderate Risk - Trigger Manual Review):
These signals warrant caution but should NOT automatically classify as fake:

1. New account but human-like behavior: +5 risk points
2. No photo/bio but consistent posting: +4 risk points
3. Patriotic symbols without donation links: +3 risk points
4. Partial template-like language: +4 risk points
5. Image partially matched (found elsewhere, non-scam context): +4 risk points

❌ FAKE / IMPERSONATOR SIGNALS (High Risk):
These signals strongly indicate scam activity:

1. Money/crypto/"support soldiers" requests: +15 risk points
2. Claims as IDF soldier/injured with donations: +12 risk points
3. Reused/stolen images across accounts: +10 risk points
4. Repetitive openers (e.g., "Thank you for supporting Israel..."): +8 risk points
5. New account with follow/engagement burst: +8 risk points
6. Username patterns (e.g., HebrewName12345): +6 risk points
7. Telegram/WhatsApp/fundraising links: +10 risk points
8. Inconsistent identity (non-native errors, wrong claims): +7 risk points
9. Overuse of military/flag imagery for manipulation: +6 risk points
10. Reverse Image Risk - Image on multiple accounts, mismatched IDF uniform, stock/scam sources, AI-generated: +12 risk points

⚖️ DE-BIASING RULES (Apply to All Analyses):
CRITICAL: These factors should NOT be penalized:

1. Lack of photo/anonymity does NOT equal scam (no penalty)
2. Use of 🇮🇱 emojis or "Am Yisrael Chai" does NOT raise suspicion (no points)
3. Patriotism/religious expression NOT penalized
4. Focus on BEHAVIORAL signals, not aesthetic/emotional tone

SCORING CALCULATION:
- Risk Score: Sum all risk points (max 100). High >60, Medium 30-60, Low <30
- Credibility Score: Sum all credibility points (max 100). High >70, Medium 40-70, Low <40

📊 CLASSIFICATION MATRIX (Final Decision):
Use this matrix to determine classification and action:

| Risk Score | Credibility Score | Classification | Action         |
|------------|-------------------|----------------|----------------|
| High       | Low               | Fake / Scam    | Flag & Remove  |
| High       | High              | Suspicious     | Manual Review  |
| Medium     | High              | Authentic      | Approve        |
| Low        | High              | Trusted        | Safe           |

For other combinations, use best judgment based on evidence balance.

REVERSE IMAGE INTELLIGENCE:
When images are provided:
1. Analyze if image appears stolen, AI-generated, or reused
2. Check for uniform inconsistencies or stock photo characteristics
3. Note if image seems unique and original
4. Document findings in evidence list

SAFE DONATION PROTOCOL:
- ONLY recommend officially verified channels (FIDF.org, official IDF channels)
- NEVER endorse unverified donation requests
- Always suggest verification through official sources

OUTPUT FORMAT:
Provide a conversational summary followed by structured JSON analysis.

Example response:
"Based on my analysis using LionsOfZion v1.3 criteria, this appears to be a legitimate account with strong credibility signals..."

{
  "summary": "Conversational summary of findings",
  "analysisData": {
    "riskScore": 15,
    "credibilityScore": 78,
    "classification": "AUTHENTIC",
    "detectedRules": [
      {
        "id": "ACCOUNT_AGE",
        "name": "Significant Account Age",
        "severity": "LOW",
        "category": "Legitimate",
        "description": "Account created in 2021 with consistent activity",
        "points": 10
      },
      {
        "id": "CONTENT_DIVERSITY",
        "name": "Diverse Content",
        "severity": "LOW",
        "category": "Legitimate",
        "description": "Posts include varied topics, replies, and original content",
        "points": 8
      },
      {
        "id": "NEW_ACCOUNT_BURST",
        "name": "Recent Account Activity",
        "severity": "MEDIUM",
        "category": "Suspicious",
        "description": "Account shows recent increase in activity",
        "points": 5
      }
    ],
    "recommendations": [
      "This account shows strong legitimacy signals",
      "No immediate red flags detected",
      "For donations, always verify through official FIDF.org"
    ],
    "reasoning": "The account demonstrates significant age (pre-2023), content diversity, and natural language patterns. While there's a recent activity increase, the overall credibility signals outweigh risk factors. No donation requests or suspicious links detected.",
    "debiasingStatus": {
      "anonymous_profile_neutralized": true,
      "patriotic_tokens_neutralized": true,
      "sentiment_penalty_capped": false
    }
  },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "v1.3"
  }
}

IMPORTANT: Always categorize detectedRules as "Legitimate", "Suspicious", or "Fake" to help users understand the signal type.`;

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
  imageBase64?: string,
  imageMimeType?: string
): Promise<FullAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

    // Prepare the prompt
    const prompt = `${SYSTEM_PROMPT}\n\nAnalyze this content for scam indicators:\n\n${text}`;

    // Prepare parts for multimodal input
    const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
      { text: prompt },
    ];

    // Add image if provided
    if (imageBase64 && imageMimeType) {
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: imageMimeType,
        },
      });

      // Add instruction for image analysis
      parts.push({
        text: '\n\nPlease also analyze the uploaded image for any visual scam indicators, fake verification badges, suspicious profile elements, or other red flags.',
      });
    }

    // Generate content
    const result = await model.generateContent(parts);
    const response = await result.response;
    const responseText = response.text();

    // Extract JSON from response

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const analysisData = JSON.parse(jsonMatch[0]);

    // Validate and structure the response
    const fullResult: FullAnalysisResult = {
      summary: analysisData.summary || extractSummaryFromText(responseText),
      analysisData: {
        riskScore: Math.max(0, Math.min(100, analysisData.analysisData?.riskScore || 0)),
        credibilityScore: Math.max(
          0,
          Math.min(100, analysisData.analysisData?.credibilityScore || 100)
        ),
        classification: validateClassification(analysisData.analysisData?.classification),
        detectedRules: validateDetectedRules(analysisData.analysisData?.detectedRules || []),
        recommendations: Array.isArray(analysisData.analysisData?.recommendations)
          ? analysisData.analysisData.recommendations
          : ['Please verify through official channels before taking any action.'],
        reasoning:
          analysisData.analysisData?.reasoning ||
          'Analysis completed based on available indicators.',
        debiasingStatus: {
          anonymous_profile_neutralized:
            analysisData.analysisData?.debiasingStatus?.anonymous_profile_neutralized ?? true,
          patriotic_tokens_neutralized:
            analysisData.analysisData?.debiasingStatus?.patriotic_tokens_neutralized ?? true,
          sentiment_penalty_capped:
            analysisData.analysisData?.debiasingStatus?.sentiment_penalty_capped ?? false,
        },
      },
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: 0, // Will be set by the API route
        version: 'v1.3', // LionsOfZion Detection Criteria v1.3
      },
    };

    return fullResult;
  } catch (error) {
    console.error('Gemini API error:', error);

    // Return a safe fallback response
    return {
      summary:
        'Unable to complete analysis due to a technical error. Please try again or verify content through official channels.',
      analysisData: {
        riskScore: 50,
        credibilityScore: 50,
        classification: Classification.SUSPICIOUS,
        detectedRules: [
          {
            id: 'ANALYSIS_ERROR',
            name: 'Analysis Error',
            severity: Severity.MEDIUM,
            description: 'Unable to complete full analysis due to technical issues.',
            points: 0,
          },
        ],
        recommendations: [
          'Verify content through official sources',
          'Exercise caution until proper analysis can be completed',
          'For donations, use only verified channels like FIDF.org',
        ],
        reasoning:
          'Analysis could not be completed due to technical difficulties. Please verify content independently.',
        debiasingStatus: {
          anonymous_profile_neutralized: true,
          patriotic_tokens_neutralized: true,
          sentiment_penalty_capped: false,
        },
      },
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: 0,
        version: 'v1.3', // LionsOfZion Detection Criteria v1.3
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

  // Handle string variations and backward compatibility
  const classStr = String(classification).toUpperCase().replace(/[/\s]/g, '_');

  // Map common variations
  const mappings: Record<string, Classification> = {
    FAKE: Classification.HIGH_RISK,
    SCAM: Classification.HIGH_RISK,
    FAKE_SCAM: Classification.FAKE_SCAM,
    TRUSTED: Classification.TRUSTED,
    AUTHENTIC: Classification.AUTHENTIC,
    SAFE: Classification.SAFE,
    SUSPICIOUS: Classification.SUSPICIOUS,
    HIGH_RISK: Classification.HIGH_RISK,
  };

  return mappings[classStr] || Classification.SUSPICIOUS;
}

/**
 * Validate detected rules array - LionsOfZion v1.3 compatible
 */
function validateDetectedRules(rules: unknown[]): DetectedRule[] {
  if (!Array.isArray(rules)) return [];

  return rules
    .filter((rule): rule is DetectedRule => {
      if (
        typeof rule !== 'object' ||
        rule === null ||
        typeof (rule as DetectedRule).id !== 'string' ||
        typeof (rule as DetectedRule).name !== 'string' ||
        typeof (rule as DetectedRule).description !== 'string' ||
        typeof (rule as DetectedRule).points !== 'number' ||
        !Object.values(Severity).includes((rule as DetectedRule).severity)
      ) {
        return false;
      }

      // Validate optional category field (v1.3)
      const category = (rule as DetectedRule).category;
      if (category !== undefined && !['Legitimate', 'Suspicious', 'Fake'].includes(category)) {
        return false;
      }

      // Validate optional imageIntelligence field (v1.3)
      const imageIntel = (rule as DetectedRule).imageIntelligence;
      if (imageIntel !== undefined && typeof imageIntel !== 'object') {
        return false;
      }

      return true;
    })
    .slice(0, 15); // Increased limit for v1.3 (more detailed signals)
}

/**
 * Perform a web search using Gemini
 */
export async function searchWeb(query: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `Please search the web for the following query and provide a summary of the results: "${query}"`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini web search error:', error);
    return 'Unable to perform web search due to a technical error.';
  }
}

/**
 * Test Gemini API connection
 */
export async function testGeminiConnection(): Promise<boolean> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Test connection. Respond with "OK".');
    const response = await result.response;
    return response.text().includes('OK');
  } catch (error) {
    console.error('Gemini connection test failed:', error);
    return false;
  }
}
