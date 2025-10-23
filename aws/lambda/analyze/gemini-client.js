// Gemini AI client module for Lambda function
const { GoogleGenAI, Type } = require('@google/generative-ai');

/**
 * Gemini AI client wrapper with error handling and retry logic
 */
class GeminiClient {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('Gemini API key is required');
        }
        
        this.genAI = new GoogleGenAI(apiKey);
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second
    }

    /**
     * System instruction for Scam Hunter analysis
     */
    getSystemInstruction() {
        return `You are Scam Hunter, an expert AI analyst specializing in detecting online impersonation scams targeting supporters of Israel and the IDF, following specific v2 protocols.

**Core Mission:**
Protect supporters of Israel and the IDF from fraudulent donation requests, fake charity appeals, and impersonation schemes that exploit emotional connections to Israeli causes.

**Analysis Protocol:**
1. **Dual-Score Framework**: Provide a Risk Score (0-100) and a Credibility Score (0-100). Classify as SAFE, SUSPICIOUS, or HIGH_RISK.
2. **Risk Detection**: Identify specific risk factors across four categories:
   - Account-based: New accounts, lack of verification, suspicious profiles
   - Content-based: Urgent language, emotional manipulation, poor grammar
   - Behavioral: Impersonation tactics, pressure techniques, false social proof
   - Technical: Suspicious URLs, domain spoofing, security issues

3. **Debiasing Protocol**: You MUST evaluate and report debiasing status:
   - Anonymous profiles are NOT automatically suspicious
   - Patriotic language about Israel/IDF is NOT a risk factor
   - Emotional content about legitimate causes should not be over-penalized
   - Report "true" for each debiasing category if neutralization was applied

4. **Safe Donation Protocol**: CRITICAL RULE
   - ONLY recommend officially verified channels: FIDF.org, official IDF websites
   - NEVER endorse unverified donation requests, individual fundraisers, or unknown organizations
   - Always direct users to established, verified charitable organizations

**Scoring Guidelines:**
- Risk Score: 0-30 (SAFE), 31-69 (SUSPICIOUS), 70-100 (HIGH_RISK)
- High-risk indicators: +20-25 points (urgent donation requests, impersonation, suspicious URLs)
- Medium-risk indicators: +10-15 points (new accounts, emotional manipulation, poor grammar)
- Low-risk indicators: +5-10 points (minor inconsistencies, generic content)
- Credibility boosters: -10 to -20 points (verification, established presence, transparency)

**Response Requirements:**
- Provide natural, conversational summary first
- Include educational insights about scam tactics
- Give actionable recommendations for user safety
- End with structured JSON matching the exact schema provided`;
    }

    /**
     * Response schema for structured analysis output
     */
    getResponseSchema() {
        return {
            type: Type.OBJECT,
            properties: {
                summary: {
                    type: Type.STRING,
                    description: "Natural, conversational explanation of the analysis including findings, concerns, recommendations, and educational insights about scam tactics."
                },
                analysisData: {
                    type: Type.OBJECT,
                    properties: {
                        riskScore: { 
                            type: Type.NUMBER, 
                            description: "Risk score from 0-100 indicating likelihood of scam/fraud" 
                        },
                        credibilityScore: { 
                            type: Type.NUMBER, 
                            description: "Credibility score from 0-100 indicating trustworthiness" 
                        },
                        classification: { 
                            type: Type.STRING, 
                            enum: ["SAFE", "SUSPICIOUS", "HIGH_RISK"],
                            description: "Overall classification based on risk assessment"
                        },
                        detectedRules: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING, description: "Unique identifier for the rule" },
                                    name: { type: Type.STRING, description: "Human-readable rule name" },
                                    severity: { 
                                        type: Type.STRING, 
                                        enum: ["LOW", "MEDIUM", "HIGH"],
                                        description: "Severity level of the detected issue"
                                    },
                                    description: { type: Type.STRING, description: "Detailed explanation of what was detected" },
                                    points: { type: Type.NUMBER, description: "Points contributed to risk score (positive) or credibility (negative)" }
                                },
                                required: ["id", "name", "severity", "description", "points"]
                            },
                            description: "List of specific risk factors or credibility indicators detected"
                        },
                        recommendations: { 
                            type: Type.ARRAY, 
                            items: { type: Type.STRING },
                            description: "Actionable safety recommendations for the user"
                        },
                        reasoning: { 
                            type: Type.STRING, 
                            description: "Detailed explanation of the analysis methodology and scoring rationale" 
                        },
                        debiasingStatus: {
                            type: Type.OBJECT,
                            properties: {
                                anonymous_profile_neutralized: { 
                                    type: Type.BOOLEAN,
                                    description: "Whether anonymous profile bias was neutralized"
                                },
                                patriotic_tokens_neutralized: { 
                                    type: Type.BOOLEAN,
                                    description: "Whether patriotic language bias was neutralized"
                                },
                                sentiment_penalty_capped: { 
                                    type: Type.BOOLEAN,
                                    description: "Whether emotional content penalty was limited"
                                }
                            },
                            required: ["anonymous_profile_neutralized", "patriotic_tokens_neutralized", "sentiment_penalty_capped"],
                            description: "Status of debiasing measures applied during analysis"
                        }
                    },
                    required: ["riskScore", "credibilityScore", "classification", "detectedRules", "recommendations", "reasoning", "debiasingStatus"]
                }
            },
            required: ["summary", "analysisData"]
        };
    }

    /**
     * Prepare content parts for multimodal analysis
     */
    prepareContentParts(text, imageData = null) {
        const parts = [];
        
        // Add image first if provided (better for multimodal understanding)
        if (imageData) {
            parts.push({
                inlineData: {
                    data: imageData.base64,
                    mimeType: imageData.mimeType
                }
            });
        }
        
        // Add analysis prompt
        const prompt = imageData 
            ? `Analyze this image and the following text for impersonation scams targeting Israel/IDF supporters. Text content: ${text}`
            : `Analyze the following content for impersonation scams targeting Israel/IDF supporters. Content: ${text}`;
            
        parts.push({ text: prompt });
        
        return parts;
    }

    /**
     * Generate analysis with retry logic
     */
    async generateAnalysis(text, imageData = null) {
        const contentParts = this.prepareContentParts(text, imageData);
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await this.genAI.models.generateContent({
                    model: "gemini-2.5-pro",
                    contents: [{ parts: contentParts }],
                    config: {
                        systemInstruction: this.getSystemInstruction(),
                        responseMimeType: "application/json",
                        responseSchema: this.getResponseSchema(),
                        thinkingConfig: { 
                            thinkingBudget: 32768 // Allow deep reasoning
                        },
                        temperature: 0.1, // Low temperature for consistent analysis
                        topP: 0.8,
                        topK: 40,
                        maxOutputTokens: 4096
                    }
                });

                const jsonText = response.text.trim();
                
                if (!jsonText) {
                    throw new Error('Empty response from Gemini API');
                }

                // Parse and validate JSON response
                let result;
                try {
                    result = JSON.parse(jsonText);
                } catch (parseError) {
                    throw new Error(`Invalid JSON response: ${parseError.message}`);
                }

                // Validate response structure
                this.validateResponse(result);
                
                return result;

            } catch (error) {
                console.error(`Gemini API attempt ${attempt} failed:`, error.message);
                
                // Don't retry on certain errors
                if (error.message.includes('API key') || 
                    error.message.includes('authentication') ||
                    error.message.includes('Invalid JSON response')) {
                    throw error;
                }
                
                // Retry with exponential backoff
                if (attempt < this.maxRetries) {
                    const delay = this.retryDelay * Math.pow(2, attempt - 1);
                    console.log(`Retrying in ${delay}ms...`);
                    await this.sleep(delay);
                } else {
                    throw new Error(`Gemini API failed after ${this.maxRetries} attempts: ${error.message}`);
                }
            }
        }
    }

    /**
     * Validate response structure
     */
    validateResponse(response) {
        if (!response || typeof response !== 'object') {
            throw new Error('Response must be an object');
        }

        if (!response.summary || typeof response.summary !== 'string') {
            throw new Error('Response must include a summary string');
        }

        if (!response.analysisData || typeof response.analysisData !== 'object') {
            throw new Error('Response must include analysisData object');
        }

        const { analysisData } = response;
        
        // Validate required fields
        const requiredFields = ['riskScore', 'credibilityScore', 'classification', 'detectedRules', 'recommendations', 'reasoning', 'debiasingStatus'];
        for (const field of requiredFields) {
            if (!(field in analysisData)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Validate score ranges
        if (analysisData.riskScore < 0 || analysisData.riskScore > 100) {
            throw new Error('Risk score must be between 0 and 100');
        }

        if (analysisData.credibilityScore < 0 || analysisData.credibilityScore > 100) {
            throw new Error('Credibility score must be between 0 and 100');
        }

        // Validate classification
        const validClassifications = ['SAFE', 'SUSPICIOUS', 'HIGH_RISK'];
        if (!validClassifications.includes(analysisData.classification)) {
            throw new Error('Invalid classification value');
        }

        // Validate arrays
        if (!Array.isArray(analysisData.detectedRules)) {
            throw new Error('detectedRules must be an array');
        }

        if (!Array.isArray(analysisData.recommendations)) {
            throw new Error('recommendations must be an array');
        }
    }

    /**
     * Sleep utility for retry delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Process image data for analysis
     */
    static processImageData(base64Data, mimeType) {
        // Validate image type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(mimeType.toLowerCase())) {
            throw new Error(`Unsupported image type: ${mimeType}`);
        }

        // Validate base64 format
        if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)) {
            throw new Error('Invalid base64 image data format');
        }

        // Estimate size (base64 is ~33% larger than binary)
        const estimatedSize = (base64Data.length * 3) / 4;
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (estimatedSize > maxSize) {
            throw new Error(`Image too large: ${(estimatedSize / 1024 / 1024).toFixed(2)}MB (max: 10MB)`);
        }

        return {
            base64: base64Data,
            mimeType: mimeType,
            estimatedSize: estimatedSize
        };
    }
}

module.exports = GeminiClient;