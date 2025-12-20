# Implementation Plan

- [x] 1. Enhance AI System Prompt with Comprehensive Detection Rules
  - Create a detailed system prompt in `src/lib/gemini-service.ts` that includes profile authenticity rules, message consistency patterns, donation request detection, image analysis guidelines, and false positive prevention constraints
  - Add bilingual output requirements (English/Hebrew) to the prompt
  - Structure the prompt with clear sections: Role Definition, Detection Rules (by category), False Positive Prevention, and Output Format
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Implement Dynamic AI Response Schema and Integration
  - [x] 2.1 Update response schema in gemini-service.ts
    - Add `riskScore`, `credibilityScore`, and `reasoning` fields to the `responseSchema` object
    - Mark these three new fields as required in the schema
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 2.2 Update analyzeWithGemini function to use dynamic values
    - Replace hardcoded `riskScore: 0` with `riskScore: parsedJson.riskScore`
    - Replace hardcoded `credibilityScore: 0` with `credibilityScore: parsedJson.credibilityScore`
    - Replace hardcoded `reasoning: ''` with `reasoning: parsedJson.reasoning`
    - _Requirements: 2.4, 2.5_

  - [x] 2.3 Verify UI displays dynamic values
    - Check that `src/components/AnalysisPanel.tsx` correctly renders the new dynamic fields
    - Add any missing UI elements to display risk score, credibility score, and reasoning
    - _Requirements: 2.5_

- [x] 3. Implement Profile Authenticity Tool (getUserProfile)
  - [x] 3.1 Create secure social lookup API route
    - Create `src/app/api/social-lookup/route.ts` with POST handler
    - Implement request validation for username and optional platform parameters
    - Add environment variable for external social media API key
    - Implement timeout handling (10 second max) and error responses
    - _Requirements: 3.1, 3.2_

  - [x] 3.2 Integrate external social media API
    - Implement API client to fetch profile data (account age, follower count, following count, verification status)
    - Handle API errors gracefully and return structured error responses
    - Apply rate limiting (5 requests per minute) to the social lookup endpoint
    - _Requirements: 3.2, 3.5_

  - [x] 3.3 Update gemini-service.ts to call social lookup API
    - Remove the hardcoded error response in the `functionCalls` handling block
    - Implement fetch call to `/api/social-lookup` with username from `call.args.username`
    - Format the API response into `FunctionResponsePart` structure
    - Handle errors and allow AI to proceed with content-only analysis if profile lookup fails
    - _Requirements: 3.1, 3.4, 3.5_

  - [x] 3.4 Update system prompt to use profile data
    - Add instructions to the system prompt explaining how to interpret profile data from getUserProfile tool
    - Include examples of how account age, follower ratios, and verification status should influence classification
    - _Requirements: 3.3_

- [x] 4. Migrate Feedback Storage to Vercel KV
  - [x] 4.1 Create feedback API route
    - Create `src/app/api/feedback/route.ts` with POST handler
    - Implement request validation for analysisId, feedbackType, and optional comment
    - Store feedback in Vercel KV with key structure: `feedback:{analysisId}:{userId}:{timestamp}`
    - Create indexes: `feedback:index:{analysisId}` and `feedback:user:{userId}` for efficient querying
    - _Requirements: 4.1, 4.4_

  - [x] 4.2 Update feedback-service.ts to use API route
    - Replace localStorage logic in `submitFeedback` function with fetch call to `/api/feedback`
    - Update `getFeedbackStats` to fetch from API (or remove if not needed)
    - Remove localStorage-based functions (`clearFeedback`, `exportFeedback`) or update to use API
    - _Requirements: 4.1_

  - [x] 4.3 Add feedback retrieval endpoint
    - Add GET handler to `/api/feedback/route.ts` to retrieve feedback by analysisId or userId
    - Implement pagination for large feedback datasets
    - _Requirements: 4.1_

- [x] 5. Migrate History Storage to Vercel KV
  - [x] 5.1 Update history API routes
    - Update `src/app/api/history/route.ts` POST handler to store history entries in Vercel KV
    - Use key structure: `history:{userId}:{analysisId}` for individual entries
    - Create sorted set index: `history:user:{userId}` with timestamp as score for efficient retrieval
    - _Requirements: 4.2, 4.4_

  - [x] 5.2 Update history API GET handler
    - Update `src/app/api/history/route.ts` GET handler to retrieve history from Vercel KV
    - Implement query by userId with sorting by timestamp (most recent first)
    - Add pagination support for users with many history entries
    - _Requirements: 4.3, 4.4_

  - [x] 5.3 Update history-service.ts to use KV-based implementation
    - Create new `KVHistoryService` class implementing `HistoryService` interface
    - Update `saveAnalysis` to call `/api/history` POST endpoint
    - Update `getHistory` to call `/api/history` GET endpoint with userId parameter
    - Update `getAnalysisById` to call `/api/history/[id]` endpoint
    - Update service factory to return `KVHistoryService` instead of `LocalHistoryService`
    - _Requirements: 4.2, 4.3_

  - [x] 5.4 Update existing history detail route
    - Update `src/app/api/history/[id]/route.ts` to retrieve from Vercel KV instead of localStorage
    - Ensure DELETE handler also removes from KV and updates indexes
    - _Requirements: 4.3_

  - [x] 5.5 Add data migration utility
    - Create optional script to migrate existing localStorage history to Vercel KV
    - Add user notification about data migration if localStorage data exists
    - _Requirements: 4.5_

- [x] 6. Harden Rate Limiter to Fail-Closed
  - [x] 6.1 Update rate limiter error handling
    - Modify `checkRateLimitWithKV` method in `src/lib/middleware/rate-limiter.ts`
    - Change catch block to return `{ allowed: false, error: 'Service temporarily unavailable', retryAfter: 60 }`
    - Add detailed error logging with timestamp, error type, and affected key
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 6.2 Update API routes to handle rate limiter errors
    - Update `/api/analyze/route.ts` to check for `error` field in rate limit result
    - Return 503 status code when rate limiter error is present (vs 429 for normal rate limit)
    - Add appropriate headers: `X-RateLimit-*` and `Retry-After`
    - _Requirements: 5.1, 5.4_

  - [x] 6.3 Apply fail-closed pattern to other rate-limited endpoints
    - Update `/api/upload/route.ts` to handle rate limiter errors with 503 response
    - Update `/api/history/route.ts` to handle rate limiter errors with 503 response
    - Update `/api/feedback/route.ts` to handle rate limiter errors with 503 response
    - _Requirements: 5.1, 5.5_

  - [x] 6.4 Add monitoring and alerting for rate limiter failures
    - Implement logging aggregation for rate limiter KV errors
    - Add metrics tracking for fail-closed events
    - _Requirements: 5.2_

- [x] 7. Integration and Verification
  - [x] 7.1 Test enhanced AI prompt with known test cases
    - Create test dataset with examples: low followers only, political content, new account + donation, stolen image
    - Run analysis on each test case and verify classifications match expectations
    - Verify bilingual output (English/Hebrew) in summary and reasoning fields
    - _Requirements: 1.5_

  - [x] 7.2 Verify dynamic AI responses in UI
    - Test that risk scores display as non-zero values from AI
    - Test that credibility scores display as non-zero values from AI
    - Test that reasoning field displays bilingual text
    - _Requirements: 2.5_

  - [x] 7.3 Test profile tool integration end-to-end
    - Submit analysis with social media username
    - Verify getUserProfile tool is called by AI
    - Verify profile data is retrieved from social lookup API
    - Verify AI reasoning mentions profile characteristics
    - _Requirements: 3.3_

  - [x] 7.4 Verify persistent storage across sessions
    - Submit feedback and verify it persists after browser refresh
    - Complete analysis and verify history persists after browser refresh
    - Test with multiple user IDs to verify data isolation
    - _Requirements: 4.5_

  - [x] 7.5 Test rate limiter fail-closed behavior
    - Simulate Vercel KV unavailability
    - Verify requests are rejected with 503 status
    - Verify normal operation resumes when KV is available
    - _Requirements: 5.1, 5.5_

  - [x] 7.6 Run regression tests
    - Execute existing test suite to ensure no functionality broke
    - Perform manual smoke testing of key user flows
    - _Requirements: All_
