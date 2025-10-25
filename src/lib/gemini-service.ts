import { Classification, FullAnalysisResult, Severity } from '@/types/analysis';
import {
  FunctionCall,
  FunctionResponsePart,
  GoogleGenerativeAI,
  SchemaType,
  Tool,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';

// ... (imports and constants remain the same)

    const model = genAI.getGenerativeModel({
      model: isAnalysis ? 'gemini-2.5-pro' : 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        ...(isAnalysis && { responseMimeType: 'application/json', responseSchema }),
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
      ...(isAnalysis && { tools }),
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
        toolResults.push({
          functionResponse: {
            name: call.name,
            response: {
              content: { error: 'Live profile analysis tool is not available in this version.' },
            },
          },
        });
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
          riskScore: 0, // riskScore is deprecated, but kept for type compatibility
          credibilityScore: 0, // credibilityScore is deprecated
          riskFactors: parsedJson.riskFactors,
          credibilityFactors: parsedJson.credibilityFactors,
          recommendation: parsedJson.recommendation,
          detectedRules: [],
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
    } else {
      // ... (conversational response remains the same)
    }
  } catch (error) {
    // ... (error handling remains the same)
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
