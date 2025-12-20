# Design Document

## Overview

This design addresses five critical deficiencies in the Scam Hunt application that prevent accurate scam detection and sustainable system evolution. The current architecture suffers from: (1) an empty AI system prompt providing no detection logic, (2) hardcoded placeholder values that disable explainability features, (3) a mocked profile analysis tool, (4) ephemeral localStorage-based data persistence, and (5) a fail-open rate limiter that disables protection during database failures.

The solution involves enhancing the AI instruction layer, implementing dynamic response handling, creating a secure social media lookup service, migrating to persistent Vercel KV storage, and hardening security middleware. These changes transform the system from a prototype with placeholder logic into a production-ready scam detection platform capable of learning from user feedback.

## Architecture

### Current Architecture Issues

```
┌─────────────────────────────────────────────────────────────┐
│                     Current Problems                         │
├─────────────────────────────────────────────────────────────┤
│ 1. Empty System Prompt → No detection rules                 │
│ 2. Hardcoded Values → No real AI output                     │
│ 3. Mocked getUserProfile → No profile analysis              │
│ 4. localStorage → Data lost on browser clear                │
│ 5. Fail-Open Rate Limiter → No protection during failures   │
└─────────────────────────────────────────────────────────────┘
```

### Target Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Client Layer (Browser)                     │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │ Chat Interface │  │ Analysis Panel │  │ History View   │ │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘ │
└───────────┼──────────────────┼──────────────────┼───────────┘
            │                  │                  │
            ▼                  ▼                  ▼
┌──────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js)                        │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │ /api/analyze   │  │ /api/feedback  │  │ /api/history   │ │
│  │ (Rate Limited) │  │ (Rate Limited) │  │ (Rate Limited) │ │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘ │
│           │                   │                   │          │
│  ┌────────┴───────────────────┴───────────────────┴───────┐ │
│  │          /api/social-lookup (NEW)                       │ │
│  │          (Secure Profile Data Retrieval)                │ │
│  └────────┬─────────────────────────────────────────────────┘│
└───────────┼──────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────┐
│                   Service Layer                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Enhanced Gemini Service (gemini-service.ts)           │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │ Comprehensive System Prompt (ENHANCED)           │  │  │
│  │  │ - Profile authenticity rules                     │  │  │
│  │  │ - Message consistency patterns                   │  │  │
│  │  │ - Donation request detection                     │  │  │
│  │  │ - False positive prevention                      │  │  │
│  │  │ - Bilingual output (EN/HE)                       │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │ Dynamic Response Schema (ENHANCED)               │  │  │
│  │  │ + riskScore: number                              │  │  │
│  │  │ + credibilityScore: number                       │  │  │
│  │  │ + reasoning: string                              │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │ Function Tool: getUserProfile (IMPLEMENTED)      │  │  │
│  │  │ - Calls /api/social-lookup                       │  │  │
│  │  │ - Returns real profile data to AI                │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Persistent Storage Services (MIGRATED TO KV)          │  │
│  │  ┌──────────────────┐  ┌──────────────────┐           │  │
│  │  │ Feedback Service │  │ History Service  │           │  │
│  │  │ (Vercel KV)      │  │ (Vercel KV)      │           │  │
│  │  └──────────────────┘  └──────────────────┘           │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Hardened Rate Limiter (FAIL-CLOSED)                   │  │
│  │  - Rejects requests on KV failure                      │  │
│  │  - Returns 503 Service Unavailable                     │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────┐
│                   External Services                           │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │ Google Gemini  │  │ Vercel KV      │  │ Social Media   │ │
│  │ AI API         │  │ (Redis)        │  │ APIs (X, etc.) │ │
│  └────────────────┘  └────────────────┘  └────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Enhanced AI System Prompt

**Location:** `src/lib/gemini-service.ts`

**Current State:**
```typescript
const SYSTEM_PROMPT = `You are "Scam Hunter," an advanced AI security expert specializing in online safety.`;
```

**Enhanced Design:**

The system prompt will be expanded to a comprehensive instruction set containing:

1. **Role Definition:** Clear identity as a bilingual (English/Hebrew) scam detection expert
2. **Detection Framework:** Explicit rules organized by category:
   - Profile Authenticity (account age, follower ratios, verification status)
   - Message Consistency (urgency language, emotional manipulation, grammar patterns)
   - Donation Requests (unusual payment methods, vague causes, pressure tactics)
   - Image Analysis (reverse search results, AI-generated detection, stolen content)
3. **False Positive Prevention:** Negative constraints to avoid common mistakes:
   - Do not flag solely based on low follower counts
   - Do not flag patriotic or political content without financial scam signals
   - Do not flag new accounts without additional risk factors
4. **Output Requirements:** Structured JSON with all required fields including new dynamic fields
5. **Bilingual Requirement:** All summary and reasoning fields in both English and Hebrew

**Prompt Structure:**
```
ROLE: You are "Scam Hunter," a bilingual (English/Hebrew) AI security expert...

DETECTION RULES:
[Profile Authenticity]
- Account age < 30 days + donation request = HIGH RISK
- Follower/following ratio < 0.1 + urgency language = SUSPICIOUS
...

[Message Consistency]
- Urgent language ("NOW", "IMMEDIATELY") + donation = HIGH RISK
- Emotional manipulation + vague cause = SUSPICIOUS
...

[Donation Requests]
- Non-standard payment methods (gift cards, crypto to personal wallet) = HIGH RISK
- Pressure tactics + unverifiable cause = SUSPICIOUS
...

[Image Analysis]
- Stolen image (reverse search match) = HIGH RISK
- AI-generated image + fake story = HIGH RISK
...

FALSE POSITIVE PREVENTION:
- DO NOT flag accounts only for low followers
- DO NOT flag political content without financial scam signals
- DO NOT flag new accounts without additional risk factors
...

OUTPUT FORMAT:
{
  "summary": "English summary | Hebrew summary",
  "classification": "SAFE|SUSPICIOUS|HIGH_RISK",
  "riskScore": 0-100,
  "credibilityScore": 0-100,
  "reasoning": "Detailed explanation in English | Detailed explanation in Hebrew",
  "riskFactors": [...],
  "credibilityFactors": [...],
  "recommendation": "..."
}
```

### 2. Dynamic Response Schema

**Location:** `src/lib/gemini-service.ts`

**Current Schema:**
```typescript
const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING },
    classification: { type: SchemaType.STRING },
    riskFactors: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    credibilityFactors: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    recommendation: { type: SchemaType.STRING },
  },
  required: ['summary', 'classification', 'riskFactors', 'credibilityFactors', 'recommendation'],
};
```

**Enhanced Schema:**
```typescript
const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING },
    classification: { type: SchemaType.STRING },
    riskScore: { type: SchemaType.NUMBER },           // NEW
    credibilityScore: { type: SchemaType.NUMBER },    // NEW
    reasoning: { type: SchemaType.STRING },           // NEW
    riskFactors: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    credibilityFactors: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    recommendation: { type: SchemaType.STRING },
  },
  required: [
    'summary', 
    'classification', 
    'riskScore',           // NEW
    'credibilityScore',    // NEW
    'reasoning',           // NEW
    'riskFactors', 
    'credibilityFactors', 
    'recommendation'
  ],
};
```

**Response Mapping:**
```typescript
// BEFORE (hardcoded)
return {
  summary: parsedJson.summary,
  analysisData: {
    classification: parsedJson.classification,
    riskScore: 0,                    // HARDCODED
    credibilityScore: 0,             // HARDCODED
    reasoning: '',                   // HARDCODED
    // ...
  },
  // ...
};

// AFTER (dynamic)
return {
  summary: parsedJson.summary,
  analysisData: {
    classification: parsedJson.classification,
    riskScore: parsedJson.riskScore,                    // FROM AI
    credibilityScore: parsedJson.credibilityScore,      // FROM AI
    reasoning: parsedJson.reasoning,                    // FROM AI
    // ...
  },
  // ...
};
```

### 3. Profile Authenticity Tool Implementation

**New API Route:** `src/app/api/social-lookup/route.ts`

**Interface:**
```typescript
// Request
interface SocialLookupRequest {
  username: string;
  platform?: 'x' | 'twitter' | 'instagram' | 'facebook';
}

// Response
interface SocialLookupResponse {
  success: boolean;
  data?: {
    username: string;
    displayName: string;
    accountAge: number;           // days since creation
    followerCount: number;
    followingCount: number;
    postCount: number;
    verified: boolean;
    profileImageUrl?: string;
    bio?: string;
    createdAt: string;
  };
  error?: string;
}
```

**Security Considerations:**
- API keys stored in environment variables (never exposed to client)
- Rate limiting applied (5 requests per minute per IP)
- Input validation and sanitization
- Timeout handling (10 second max)
- Error responses that don't leak internal details

**Integration with Gemini Service:**

```typescript
// In gemini-service.ts, replace the hardcoded error:
if (functionCalls.length > 0) {
  const toolResults: FunctionResponsePart[] = [];
  
  for (const call of functionCalls) {
    if (call.name === 'getUserProfile') {
      try {
        // Call the new API route
        const response = await fetch('/api/social-lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: call.args.username }),
        });
        
        const data = await response.json();
        
        toolResults.push({
          functionResponse: {
            name: call.name,
            response: {
              content: data.success ? data.data : { error: data.error },
            },
          },
        });
      } catch (error) {
        toolResults.push({
          functionResponse: {
            name: call.name,
            response: {
              content: { error: 'Profile lookup failed' },
            },
          },
        });
      }
    }
  }
  
  // Send tool results back to AI
  result = await chat.sendMessageStream(toolResults);
  // ... process response
}
```

### 4. Persistent Storage Migration

#### 4.1 Feedback Service Migration

**New API Route:** `src/app/api/feedback/route.ts`

**Interface:**
```typescript
// POST /api/feedback
interface FeedbackRequest {
  analysisId: string;
  feedbackType: 'up' | 'down';
  comment?: string;
}

interface FeedbackResponse {
  success: boolean;
  message?: string;
  error?: string;
}
```

**Vercel KV Schema:**
```typescript
// Key structure: feedback:{analysisId}:{userId}:{timestamp}
// Value: FeedbackData object
{
  analysisId: string;
  userId: string;
  feedbackType: 'up' | 'down';
  comment?: string;
  userAgent: string;
  timestamp: string;
}

// Index for querying: feedback:index:{analysisId} → Set of feedback IDs
// Index for user feedback: feedback:user:{userId} → Set of feedback IDs
```

**Updated Service:**
```typescript
// src/lib/feedback-service.ts
export async function submitFeedback(feedback: FeedbackData): Promise<FeedbackResponse> {
  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback),
    });
    
    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

#### 4.2 History Service Migration

**New API Routes:** 
- `src/app/api/history/route.ts` (GET, POST)
- `src/app/api/history/[id]/route.ts` (GET, DELETE) - already exists, needs KV migration

**Interface:**
```typescript
// POST /api/history
interface SaveHistoryRequest {
  analysis: FullAnalysisResult;
  conversation: Message[];
  input: {
    message: string;
    imageUrl?: string;
  };
  processingTime: number;
}

interface SaveHistoryResponse {
  success: boolean;
  id?: string;
  error?: string;
}

// GET /api/history?userId={userId}
interface GetHistoryResponse {
  success: boolean;
  history?: HistoryEntry[];
  error?: string;
}
```

**Vercel KV Schema:**
```typescript
// Key structure: history:{userId}:{analysisId}
// Value: HistoryEntry object
{
  id: string;
  userId: string;
  timestamp: string;
  analysis: FullAnalysisResult;
  conversation: Message[];
  input: { message: string; imageUrl?: string };
  processingTime: number;
  userAgent?: string;
}

// Index: history:user:{userId} → Sorted Set (score = timestamp, member = analysisId)
// Allows efficient retrieval of user's history sorted by time
```

**Updated Service:**
```typescript
// src/lib/history-service.ts
class KVHistoryService implements HistoryService {
  async saveAnalysis(request: SaveAnalysisRequest): Promise<SaveAnalysisResponse> {
    const response = await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    return await response.json();
  }
  
  async getHistory(userId?: string): Promise<HistoryEntry[]> {
    const currentUserId = userId || getAnonymousUserId();
    const response = await fetch(`/api/history?userId=${currentUserId}`);
    const data = await response.json();
    
    return data.success ? data.history : [];
  }
  
  // ... other methods
}
```

### 5. Hardened Rate Limiter

**Location:** `src/lib/middleware/rate-limiter.ts`

**Current Issue:**
```typescript
} catch (error) {
  console.warn('Rate limiter KV error:', error);
  // Fails open, allowing the request  ← SECURITY ISSUE
}
```

**Hardened Implementation:**
```typescript
private async checkRateLimitWithKV(key: string): Promise<{
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  error?: string;
}> {
  const now = Date.now();
  const windowStart = now - this.config.windowMs;
  const kvKey = `ratelimit:${key}`;

  try {
    // Remove old entries outside the sliding window
    await kv.zremrangebyscore(kvKey, 0, windowStart);

    // Count requests in current window
    const count = await kv.zcard(kvKey);

    const allowed = count < this.config.maxRequests;
    const remaining = allowed ? this.config.maxRequests - (count + 1) : 0;

    if (allowed) {
      await kv.zadd(kvKey, { score: now, member: `${now}-${Math.random()}` });
      await kv.expire(kvKey, Math.ceil(this.config.windowMs / 1000));
    }

    const oldestTimestamp = await kv.zrange(kvKey, 0, 0, { withScores: true });
    const resetTime = oldestTimestamp.length > 0 
      ? (oldestTimestamp[1] as number) + this.config.windowMs
      : now + this.config.windowMs;

    const retryAfter = allowed ? undefined : Math.ceil((resetTime - now) / 1000);

    return {
      allowed,
      limit: this.config.maxRequests,
      remaining,
      resetTime,
      retryAfter,
    };
  } catch (error) {
    // FAIL-CLOSED: Reject request on database failure
    console.error('Rate limiter KV error (failing closed):', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      key: kvKey,
    });
    
    return {
      allowed: false,                           // REJECT REQUEST
      limit: this.config.maxRequests,
      remaining: 0,
      resetTime: now + this.config.windowMs,
      retryAfter: 60,                          // Retry after 1 minute
      error: 'Service temporarily unavailable', // User-friendly message
    };
  }
}
```

**API Route Integration:**
```typescript
// In API routes (e.g., /api/analyze/route.ts)
export async function POST(request: NextRequest) {
  const rateLimitResult = await analysisRateLimiter.checkRateLimit(request);
  
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { 
        error: rateLimitResult.error || 'Rate limit exceeded',
        retryAfter: rateLimitResult.retryAfter,
      },
      { 
        status: rateLimitResult.error ? 503 : 429,  // 503 for KV failure, 429 for rate limit
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          ...(rateLimitResult.retryAfter && {
            'Retry-After': rateLimitResult.retryAfter.toString(),
          }),
        },
      }
    );
  }
  
  // ... proceed with request
}
```

## Data Models

### Enhanced Analysis Result

```typescript
// src/types/analysis.ts (updated)
export interface AnalysisData {
  riskScore: number;              // 0-100, from AI (no longer hardcoded)
  credibilityScore: number;       // 0-100, from AI (no longer hardcoded)
  classification: Classification;
  detectedRules: DetectedRule[];
  recommendations: string[];
  reasoning: string;              // Bilingual, from AI (no longer hardcoded)
  debiasingStatus: DebiasingStatus;
  riskFactors?: string[];
  credibilityFactors?: string[];
  recommendation?: string;
}
```

### Feedback Data Model

```typescript
// Stored in Vercel KV
interface FeedbackData {
  analysisId: string;
  userId: string;
  feedbackType: 'up' | 'down';
  comment?: string;
  userAgent: string;
  timestamp: string;
}
```

### History Entry Model

```typescript
// Stored in Vercel KV
interface HistoryEntry {
  id: string;
  userId: string;
  timestamp: string;
  analysis: FullAnalysisResult;
  conversation: Message[];
  input: {
    message: string;
    imageUrl?: string;
  };
  processingTime: number;
  userAgent?: string;
}
```

### Social Profile Data Model

```typescript
// Returned by /api/social-lookup
interface SocialProfileData {
  username: string;
  displayName: string;
  accountAge: number;           // days since creation
  followerCount: number;
  followingCount: number;
  postCount: number;
  verified: boolean;
  profileImageUrl?: string;
  bio?: string;
  createdAt: string;
}
```

## Error Handling

### 1. AI Service Errors

**Scenarios:**
- Gemini API unavailable
- Invalid API key
- Response parsing failure
- Function tool execution failure

**Handling:**
```typescript
try {
  // AI analysis
} catch (err) {
  console.error('Gemini analysis error:', err);
  
  // Return user-friendly error
  throw new Error(
    err instanceof Error 
      ? `Analysis failed: ${err.message}` 
      : 'Analysis service temporarily unavailable'
  );
}
```

### 2. Storage Errors

**Scenarios:**
- Vercel KV unavailable
- Write operation failure
- Read operation failure

**Handling:**
```typescript
// Feedback Service
try {
  await kv.set(key, value);
  return { success: true };
} catch (error) {
  console.error('KV write error:', error);
  return { 
    success: false, 
    error: 'Failed to save feedback. Please try again.' 
  };
}

// History Service
try {
  const data = await kv.get(key);
  return { success: true, data };
} catch (error) {
  console.error('KV read error:', error);
  return { 
    success: false, 
    error: 'Failed to retrieve history. Please try again.' 
  };
}
```

### 3. Rate Limiter Errors

**Scenario:** Vercel KV unavailable during rate limit check

**Handling:**
```typescript
try {
  // Rate limit check
} catch (error) {
  console.error('Rate limiter KV error (failing closed):', {
    error: error instanceof Error ? error.message : 'Unknown error',
    timestamp: new Date().toISOString(),
    endpoint: request.url,
  });
  
  // FAIL-CLOSED: Reject request
  return {
    allowed: false,
    error: 'Service temporarily unavailable',
    retryAfter: 60,
  };
}
```

### 4. Social Lookup Errors

**Scenarios:**
- External API unavailable
- Invalid username
- API rate limit exceeded
- Timeout

**Handling:**
```typescript
try {
  const response = await fetch(externalAPI, { signal: AbortSignal.timeout(10000) });
  
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }
  
  return { success: true, data: await response.json() };
} catch (error) {
  console.error('Social lookup error:', error);
  
  // Return structured error that AI can handle
  return { 
    success: false, 
    error: 'Profile data unavailable. Analysis will proceed with content only.' 
  };
}
```

## Testing Strategy

### 1. AI Prompt Testing

**Objective:** Verify enhanced prompt produces accurate classifications and avoids false positives

**Test Cases:**
- **Low follower count alone:** Should NOT flag as scam
- **Political content without financial ask:** Should NOT flag as scam
- **New account + donation request + urgency:** Should flag as HIGH_RISK
- **Stolen image + fake story:** Should flag as HIGH_RISK
- **Legitimate charity with verification:** Should classify as SAFE or TRUSTED

**Method:**
- Create test dataset with known scam/legitimate examples
- Run analysis on each example
- Compare classification against expected result
- Measure accuracy, precision, recall

### 2. Dynamic Response Integration Testing

**Objective:** Verify AI-generated scores and reasoning are displayed correctly

**Test Cases:**
- Verify `riskScore` is between 0-100 and not hardcoded to 0
- Verify `credibilityScore` is between 0-100 and not hardcoded to 0
- Verify `reasoning` contains bilingual text and is not empty string
- Verify UI displays all three fields correctly

**Method:**
- Unit tests for `analyzeWithGemini` function
- Integration tests for API route
- E2E tests for UI display

### 3. Profile Tool Testing

**Objective:** Verify getUserProfile tool retrieves real data and AI incorporates it

**Test Cases:**
- Valid username returns profile data
- Invalid username returns error gracefully
- AI analysis mentions profile data in reasoning
- Analysis without profile data still completes

**Method:**
- Mock external API responses
- Test API route with various inputs
- Verify Gemini service handles tool responses
- Check AI reasoning includes profile insights

### 4. Storage Migration Testing

**Objective:** Verify data persists in Vercel KV and survives browser sessions

**Test Cases:**
- Feedback saved to KV and retrievable
- History saved to KV and retrievable
- Data persists after browser clear
- Multiple users have isolated data

**Method:**
- Integration tests with Vercel KV test instance
- E2E tests simulating user sessions
- Data isolation tests with multiple user IDs

### 5. Rate Limiter Hardening Testing

**Objective:** Verify rate limiter fails closed during KV failures

**Test Cases:**
- Normal operation: requests allowed within limit
- Rate limit exceeded: requests blocked with 429
- KV unavailable: requests blocked with 503
- KV recovery: normal operation resumes

**Method:**
- Unit tests with mocked KV responses
- Integration tests with KV connection failures
- Load tests to verify rate limiting accuracy

### 6. Regression Testing

**Objective:** Ensure existing functionality remains intact

**Test Cases:**
- Chat interface still works
- Image upload still works
- Analysis panel displays results
- Export functionality works
- Navigation and routing work

**Method:**
- Run existing test suite
- Manual smoke testing of key user flows
- Visual regression testing for UI components
