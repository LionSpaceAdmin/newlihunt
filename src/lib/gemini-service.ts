import { Classification, DetectedRule, FullAnalysisResult, Severity } from '@/types/analysis';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// System prompt for scam analysis
const SYSTEM_PROMPT = `You are "Scam Hunter," an expert AI analyst specializing in detecting online impersonation scams, particularly those targeting supporters of Israel and the IDF. Your mission is to protect people from fraudulent donation requests and fake accounts.

ANALYSIS FRAMEWORK:
You must provide both a Risk Score (0-100) and Credibility Score (0-100):
- Risk Score: Higher = more dangerous (scam indicators)
- Credibility Score: Higher = more trustworthy (legitimacy indicators)

CLASSIFICATION RULES:
- SAFE: Risk ≤ 30 AND Credibility ≥ 70
- SUSPICIOUS: Mixed signals or moderate risk/credibility
- HIGH_RISK: Risk ≥ 70 OR Credibility ≤ 30

DETECTION RULES TO CHECK:
1. Account Age & Verification (NEW_ACCOUNT, UNVERIFIED_ACCOUNT)
2. Profile Completeness (INCOMPLETE_PROFILE, GENERIC_AVATAR)
3. Content Patterns (URGENT_LANGUAGE, EMOTIONAL_MANIPULATION)
4. Donation Requests (UNVERIFIED_DONATION, SUSPICIOUS_PAYMENT_METHODS)
5. Technical Indicators (SUSPICIOUS_LINKS, FAKE_VERIFICATION_BADGES)
6. Behavioral Patterns (MASS_MESSAGING, COPY_PASTE_CONTENT)

DEBIASING MEASURES:
- anonymous_profile_neutralized: Ignore profile appearance bias
- patriotic_tokens_neutralized: Don't favor pro-Israel content automatically
- sentiment_penalty_capped: Limit emotional content penalties

SAFE DONATION PROTOCOL:
- ONLY recommend officially verified channels (FIDF.org, official IDF channels)
- NEVER endorse unverified donation requests
- Always suggest verification through official sources

OUTPUT FORMAT:
Provide a conversational summary followed by structured JSON analysis.

Example response:
"Based on my analysis, this appears to be a suspicious account with several red flags..."

{
  "summary": "Conversational summary of findings",
  "analysisData": {
    "riskScore": 75,
    "credibilityScore": 25,
    "classification": "HIGH_RISK",
    "detectedRules": [
      {
        "id": "NEW_ACCOUNT",
        "name": "Recently Created Account",
        "severity": "MEDIUM",
        "description": "Account was created within the last 30 days",
        "points": 15
      }
    ],
    "recommendations": [
      "Do not donate through this account",
      "Verify through official FIDF.org website"
    ],
    "reasoning": "Detailed explanation of the analysis",
    "debiasingStatus": {
      "anonymous_profile_neutralized": true,
      "patriotic_tokens_neutralized": true,
      "sentiment_penalty_capped": false
    }
  },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00Z"
  }
}`;

/**
 * Analyze content for scam indicators
 */
export async function analyzeScam(
  text: string,
  imageBase64?: string,
  imageMimeType?: string
): Promise<FullAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

    // Prepare the prompt
    let prompt = `${SYSTEM_PROMPT}\n\nAnalyze this content for scam indicators:\n\n${text}`;

    // Prepare parts for multimodal input
    const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
      { text: prompt }
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
        text: "\n\nPlease also analyze the uploaded image for any visual scam indicators, fake verification badges, suspicious profile elements, or other red flags."
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
        credibilityScore: Math.max(0, Math.min(100, analysisData.analysisData?.credibilityScore || 100)),
        classification: validateClassification(analysisData.analysisData?.classification),
        detectedRules: validateDetectedRules(analysisData.analysisData?.detectedRules || []),
        recommendations: Array.isArray(analysisData.analysisData?.recommendations) 
          ? analysisData.analysisData.recommendations 
          : ['Please verify through official channels before taking any action.'],
        reasoning: analysisData.analysisData?.reasoning || 'Analysis completed based on available indicators.',
        debiasingStatus: {
          anonymous_profile_neutralized: analysisData.analysisData?.debiasingStatus?.anonymous_profile_neutralized ?? true,
          patriotic_tokens_neutralized: analysisData.analysisData?.debiasingStatus?.patriotic_tokens_neutralized ?? true,
          sentiment_penalty_capped: analysisData.analysisData?.debiasingStatus?.sentiment_penalty_capped ?? false,
        },
      },
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: 0, // Will be set by the API route
        version: '2.1.0',
      },
    };

    return fullResult;
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // Return a safe fallback response
    return {
      summary: 'Unable to complete analysis due to a technical error. Please try again or verify content through official channels.',
      analysisData: {
        riskScore: 50,
        credibilityScore: 50,
        classification: Classification.SUSPICIOUS,
        detectedRules: [{
          id: 'ANALYSIS_ERROR',
          name: 'Analysis Error',
          severity: Severity.MEDIUM,
          description: 'Unable to complete full analysis due to technical issues.',
          points: 0,
        }],
        recommendations: [
          'Verify content through official sources',
          'Exercise caution until proper analysis can be completed',
          'For donations, use only verified channels like FIDF.org',
        ],
        reasoning: 'Analysis could not be completed due to technical difficulties. Please verify content independently.',
        debiasingStatus: {
          anonymous_profile_neutralized: true,
          patriotic_tokens_neutralized: true,
          sentiment_penalty_capped: false,
        },
      },
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: 0,
        version: '2.1.0',
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
 * Validate classification value
 */
function validateClassification(classification: unknown): Classification {
  if (Object.values(Classification).includes(classification as Classification)) {
    return classification as Classification;
  }
  return Classification.SUSPICIOUS;
}

/**
 * Validate detected rules array
 */
function validateDetectedRules(rules: unknown[]): DetectedRule[] {
  if (!Array.isArray(rules)) return [];
  
  return rules
    .filter((rule): rule is DetectedRule => {
      return (
        typeof rule === 'object' &&
        rule !== null &&
        typeof (rule as DetectedRule).id === 'string' &&
        typeof (rule as DetectedRule).name === 'string' &&
        typeof (rule as DetectedRule).description === 'string' &&
        typeof (rule as DetectedRule).points === 'number' &&
        Object.values(Severity).includes((rule as DetectedRule).severity)
      );
    })
    .slice(0, 10); // Limit to 10 rules max
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