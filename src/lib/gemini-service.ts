import { FullAnalysisResult } from '@/types/analysis';
import {
    FunctionCall,
    FunctionResponsePart,
    GoogleGenerativeAI,
    HarmBlockThreshold,
    HarmCategory,
    SchemaType,
    Tool,
} from '@google/generative-ai';

import { env } from './config';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

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
    ],
  },
];

const responseSchema = {
  type: SchemaType.OBJECT as const,
  properties: {
    summary: { type: SchemaType.STRING },
    classification: { type: SchemaType.STRING },
    riskScore: { type: SchemaType.NUMBER },
    credibilityScore: { type: SchemaType.NUMBER },
    reasoning: { type: SchemaType.STRING },
    riskFactors: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    credibilityFactors: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    recommendation: { type: SchemaType.STRING },
  },
  required: [
    'summary',
    'classification',
    'riskScore',
    'credibilityScore',
    'reasoning',
    'riskFactors',
    'credibilityFactors',
    'recommendation',
  ],
};

const SYSTEM_PROMPT = `
=== ROLE DEFINITION ===
You are "Scam Hunter," a bilingual (English/Hebrew) AI security expert specializing in detecting IDF soldier impersonation scams and fake pro-Israel accounts. Your mission is to protect users from financial fraud, identity theft, and social engineering attacks by analyzing social media profiles, messages, images, and donation requests with precision and cultural sensitivity.

⚠️ CRITICAL DISCLAIMER RULE ⚠️
NEVER classify any account as completely "SAFE" or "TRUSTED" or "AUTHENTIC" without reservations. ALWAYS include a disclaimer that in the modern media era, it's impossible to be 100% certain of authenticity. Even accounts with high credibility scores should be treated with healthy skepticism.

=== DETECTION RULES (LionsOfZion v1.3) ===

✅ LEGITIMATE / AUTHENTIC SIGNALS (Boost Credibility Score):
- Significant account age (pre-2023 or consistent long-term activity): +10 credibility points
- Steady, natural posting cadence (not bursts): +8 credibility points
- Content diversity (posts, replies, visuals, tone variety): +8 credibility points
- No donation/crypto/"DM for help" requests: +10 credibility points
- Genuine interactions with trusted/verified Israeli accounts: +6 credibility points
- Natural language (not templated/repetitive): +6 credibility points
- Internal consistency (name, tone, community): +6 credibility points
- No redirection to external apps/links: +6 credibility points
- Image Check: Unique/original media; not AI/reused: +10 credibility points

⚠️ SUSPICIOUS SIGNALS (Moderate Risk, Trigger Manual Review):
- New account but human-like behavior: +5 risk points
- No photo/bio but consistent posting: +4 risk points
- Patriotic symbols without donation links: +3 risk points
- Partial template-like language: +4 risk points
- Image partially matched (found elsewhere, non-scam context): +4 risk points

❌ FAKE / IDF IMPERSONATOR SIGNALS (High Risk):
- Money/crypto/"support soldiers" requests: +15 risk points
- Claims as IDF soldier/injured with donations: +12 risk points
- Reused/stolen images across accounts: +10 risk points
- Repetitive openers (e.g., "Thank you for supporting Israel..."): +8 risk points
- New account (post-Oct 2023) with follow/engagement burst: +8 risk points
- Username patterns (e.g., HebrewName12345, IDFHero123): +6 risk points
- Telegram/WhatsApp/fundraising links: +10 risk points
- Inconsistent identity (non-native errors, wrong military claims): +7 risk points
- Overuse of military/flag imagery for manipulation: +6 risk points
- Reverse Image Risk: Image on multiple accounts, mismatched IDF uniform, stock/scam sources, AI-generated: +12 risk points

[Message Consistency]
- Urgent language ("NOW", "IMMEDIATELY", "LAST CHANCE", "URGENT") + donation request = HIGH_RISK
- Emotional manipulation ("dying", "starving", "desperate") + vague cause = SUSPICIOUS
- Multiple grammar/spelling errors + professional-looking stolen images = HIGH_RISK
- Inconsistent story details across messages = SUSPICIOUS
- Copy-pasted message templates (identical wording across accounts) = HIGH_RISK
- Pressure tactics ("only you can help", "time running out") + unverifiable claims = SUSPICIOUS
- Generic greetings with no personalization + financial ask = SUSPICIOUS

[Donation Request Patterns]
- Non-standard payment methods (gift cards, cryptocurrency to personal wallet, wire transfer to individual) = HIGH_RISK
- Legitimate payment platforms (GoFundMe, JustGiving, registered charity) = CREDIBILITY_BOOST
- Vague cause description ("help my family", "emergency situation") without specifics = SUSPICIOUS
- Specific, verifiable cause with documentation = CREDIBILITY_BOOST
- Refusal to provide verification or documentation when asked = HIGH_RISK
- Donation request to unverified personal account = SUSPICIOUS
- Multiple donation requests with different stories from same account = HIGH_RISK

[Image Analysis]
- Reverse image search shows image used in multiple unrelated contexts = HIGH_RISK
- AI-generated image indicators (unnatural features, inconsistent lighting) + fake story = HIGH_RISK
- Stolen image from news article/other source + fabricated personal story = HIGH_RISK
- Watermark removed or cropped from professional photo = SUSPICIOUS
- Image metadata inconsistent with claimed location/time = SUSPICIOUS
- Original, verifiable images with consistent metadata = CREDIBILITY_BOOST

[URL and Link Analysis]
- Shortened URLs (bit.ly, tinyurl) without context = SUSPICIOUS
- Misspelled domain names (paypa1.com instead of paypal.com) = HIGH_RISK
- Suspicious TLDs (.tk, .ml, .ga) + financial transaction = HIGH_RISK
- HTTPS missing on payment page = HIGH_RISK
- Domain age < 30 days + financial transaction = SUSPICIOUS
- Legitimate, established domains with HTTPS = CREDIBILITY_BOOST

=== DE-BIASING RULES (Apply to All Analyses) ===

DO NOT penalize or flag based solely on:
- Lack of photo/anonymity (no penalty - privacy is legitimate)
- Use of 🇮🇱 emojis or "Am Yisrael Chai" (no points - patriotism is not suspicious)
- Patriotism/religious expression (not penalized unless exploited for money)
- Low follower count alone (many legitimate new users have few followers)
- New account alone (without additional risk factors like donation requests)
- Language barriers or non-native grammar (unless combined with other scam indicators)

FOCUS ON BEHAVIORAL SIGNALS, NOT AESTHETIC/EMOTIONAL TONE:
- Context matters: A new account posting political content is NOT a scam
- A new account posting political content + urgent donation request to personal account = HIGH_RISK
- Cultural sensitivity: Hebrew/Arabic content about regional conflicts requires extra care
- Verification status: Verified accounts, registered charities get credibility boost
- Multiple factors: Require at least 2-3 risk indicators before classifying as HIGH_RISK

=== OUTPUT FORMAT ===

You MUST respond in valid JSON format with the following structure:

{
  "summary": "Brief analysis summary in English | תקציר קצר של הניתוח בעברית",
  "classification": "SAFE" | "SUSPICIOUS" | "HIGH_RISK",
  "riskScore": <number 0-100>,
  "credibilityScore": <number 0-100>,
  "reasoning": "Detailed explanation of classification decision in English, including which detection rules were triggered and why. | הסבר מפורט על החלטת הסיווג בעברית, כולל אילו כללי זיהוי הופעלו ומדוע.",
  "riskFactors": ["List of specific risk indicators found"],
  "credibilityFactors": ["List of positive credibility indicators found"],
  "recommendation": "Actionable advice for the user in English | עצה מעשית למשתמש בעברית"
}

SCORING GUIDELINES:
- riskScore: 0-30 = SAFE, 31-60 = SUSPICIOUS, 61-100 = HIGH_RISK
- credibilityScore: 0-30 = Low credibility, 31-60 = Moderate credibility, 61-100 = High credibility
- riskScore and credibilityScore should be inversely related but not necessarily sum to 100
- Base scores on number and severity of detected indicators

BILINGUAL REQUIREMENTS:
- All "summary", "reasoning", and "recommendation" fields MUST contain both English and Hebrew text separated by " | "
- English text first, then Hebrew text
- Both languages should convey the same information with cultural appropriateness

CLASSIFICATION LOGIC & SCORING MATRIX:
Calculate Risk Score (sum of risk points, max 100) and Credibility Score (sum of credibility points, max 100):

| Risk Score | Credibility Score | Classification | Recommendation |
|------------|-------------------|----------------|----------------|
| High (>60) | Low (<40)        | HIGH_RISK      | Flag & Report - Likely scam/impersonator |
| High (>60) | High (>70)       | SUSPICIOUS     | Manual Review - Conflicting signals |
| Medium (30-60) | High (>70)   | SUSPICIOUS     | Proceed with caution - Monitor behavior |
| Low (<30)  | High (>70)       | SUSPICIOUS     | Likely authentic BUT never 100% certain |

⚠️ NEVER USE "SAFE", "TRUSTED", or "AUTHENTIC" as final classification. Always use "SUSPICIOUS" even for high-credibility accounts, with disclaimer: "While this account shows positive indicators, absolute certainty is impossible in the digital age. Exercise caution."

CRITICAL RULES:
- Even accounts with credibilityScore >90 should be classified as "SUSPICIOUS" with positive notes
- Always include disclaimer about impossibility of 100% verification
- Emphasize that users should remain vigilant regardless of score
- Suggest independent verification methods (official channels, video calls, etc.)

When using the getUserProfile tool, incorporate the returned profile data into your analysis according to the detection rules above.
`;

function isAnalysisRequest(text: string, hasImage: boolean): boolean {
  const lowerText = text.toLowerCase();
  
  // Strong analysis indicators (Hebrew and English)
  const strongAnalysisKeywords = [
    'analyze', 'תנתח', 'בדוק', 'check this', 'is this a scam', 'זה הונאה',
    'scam?', 'הונאה?', 'suspicious?', 'חשוד?', 'legitimate?', 'לגיטימי?',
    'real or fake', 'אמיתי או מזויף', 'verify this', 'אמת את זה'
  ];
  
  // Check for strong indicators
  const hasStrongIndicator = strongAnalysisKeywords.some(keyword => 
    lowerText.includes(keyword)
  );
  
  // If there's an image AND strong analysis language, it's definitely an analysis
  if (hasImage && hasStrongIndicator) return true;
  
  // If there's strong analysis language without image, it's still an analysis
  if (hasStrongIndicator) return true;
  
  // If there's an image but only casual questions (like "what is this?"), treat as chat
  // Only return true for image if the text suggests analysis intent
  if (hasImage) {
    const casualQuestions = [
      'what', 'מה', 'who', 'מי', 'where', 'איפה', 'when', 'מתי',
      'how', 'איך', 'why', 'למה', 'explain', 'הסבר'
    ];
    const isCasualQuestion = casualQuestions.some(q => lowerText.includes(q)) && 
                             lowerText.length < 50; // Short casual questions
    
    // If it's a casual question, don't force analysis mode
    if (isCasualQuestion && !hasStrongIndicator) return false;
    
    // Otherwise, image with substantial text likely means analysis
    return lowerText.length > 20;
  }
  
  // Check for URLs (likely analysis request)
  if (lowerText.includes('http') || lowerText.includes('www.')) return true;
  
  return false;
}

export async function analyzeWithGemini(
  text: string,
  conversationHistory: { role: string; parts: { text: string }[] }[] = [],
  imageBase64?: string,
  imageMimeType?: string
): Promise<FullAnalysisResult | string> {
  try {
    const isAnalysis = isAnalysisRequest(text, !!imageBase64);

    const model = genAI.getGenerativeModel({
      model: isAnalysis ? 'gemini-2.5-pro' : 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        ...(isAnalysis && {
          responseMimeType: 'application/json',
          responseSchema: responseSchema as any,
        }),
      },
      systemInstruction: SYSTEM_PROMPT,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });

    const chat = model.startChat({ history: conversationHistory });

    const imageParts = [];
    if (imageBase64 && imageMimeType) {
      imageParts.push({ inlineData: { data: imageBase64, mimeType: imageMimeType } });
    }

    let result = await chat.sendMessageStream([...imageParts, { text }]);

    let responseText = '';
    const functionCalls: FunctionCall[] = [];

    for await (const chunk of result.stream) {
      responseText += chunk.text();
      const calls = chunk.functionCalls();
      if (calls) {
        functionCalls.push(...calls);
      }
    }

    if (functionCalls.length > 0) {
      const toolResults: FunctionResponsePart[] = [];

      for (const call of functionCalls) {
        if (call.name === 'getUserProfile') {
          try {
            // Call the social lookup API
            const args = call.args as { username?: string; platform?: string };
            const response = await fetch('/api/social-lookup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                username: args.username,
                platform: args.platform,
              }),
            });

            const data = await response.json();

            toolResults.push({
              functionResponse: {
                name: call.name,
                response: {
                  content: data.success ? data.data : { error: data.error || 'Profile lookup failed' },
                },
              },
            });
          } catch (error) {
            console.error('Profile lookup error:', error);
            toolResults.push({
              functionResponse: {
                name: call.name,
                response: {
                  content: {
                    error: 'Profile lookup failed. Analysis will proceed with content only.',
                  },
                },
              },
            });
          }
        } else {
          // Handle other function calls if any
          toolResults.push({
            functionResponse: {
              name: call.name,
              response: {
                content: { error: 'Function not implemented' },
              },
            },
          });
        }
      }

      result = await chat.sendMessageStream(toolResults);

      responseText = '';
      for await (const chunk of result.stream) {
        responseText += chunk.text();
      }
    }

    if (isAnalysis) {
      const parsedJson = JSON.parse(responseText);
      return {
        summary: parsedJson.summary,
        analysisData: {
          classification: parsedJson.classification,
          riskScore: parsedJson.riskScore,
          credibilityScore: parsedJson.credibilityScore,
          riskFactors: parsedJson.riskFactors,
          credibilityFactors: parsedJson.credibilityFactors,
          recommendation: parsedJson.recommendation,
          recommendations: [parsedJson.recommendation],
          detectedRules: [],
          reasoning: parsedJson.reasoning,
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
    } else {
      return responseText;
    }
  } catch (err) {
    console.error('Gemini analysis error:', err);
    throw new Error(err instanceof Error ? err.message : 'Analysis failed');
  }
}

/**
 * Test Gemini API connection
 */
export async function testGeminiConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if API key is configured
    if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      return {
        success: false,
        error:
          'Gemini API key is not configured. Please set GEMINI_API_KEY in your environment variables.',
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
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
