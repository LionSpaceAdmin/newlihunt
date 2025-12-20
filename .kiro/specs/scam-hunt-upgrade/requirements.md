# Requirements Document

## Introduction

This specification addresses critical deficiencies in the Scam Hunt application that prevent it from achieving its core mission: accurate detection and analysis of online scams. The current system suffers from three fundamental problems: (1) an empty AI system prompt that provides no detection logic, (2) hardcoded placeholder values that render the explainability features non-functional, and (3) ephemeral data storage that prevents learning from user feedback. This upgrade plan focuses on fixing the AI core logic, implementing proper data persistence, and hardening security mechanisms to create a production-ready scam detection system.

## Glossary

- **Scam Hunt System**: The web application that analyzes social media profiles, messages, and content to detect potential scams
- **AI Analysis Engine**: The Gemini-based service (gemini-service.ts) that performs scam detection and classification
- **System Prompt**: The instruction set provided to the AI that defines detection rules, analysis methodology, and output format
- **Profile Authenticity Tool**: The getUserProfile function tool that retrieves social media account metadata for AI analysis
- **Analysis Result**: The structured output containing classification, risk scores, credibility scores, and reasoning
- **Feedback Service**: The component that collects user ratings (thumbs up/down) on analysis accuracy
- **History Service**: The component that stores and retrieves past analysis results for users
- **Vercel KV**: The Redis-compatible key-value database used for persistent data storage
- **Rate Limiter**: The middleware component that prevents API abuse by limiting request frequency per user
- **False Positive**: An incorrect classification where legitimate content is flagged as a scam

## Requirements

### Requirement 1: AI System Prompt Enhancement

**User Story:** As a user analyzing potentially fraudulent content, I want the AI to apply comprehensive detection rules and avoid false positives, so that I receive accurate and trustworthy scam assessments.

#### Acceptance Criteria

1. WHEN the AI Analysis Engine initializes, THE Scam Hunt System SHALL load a System Prompt that contains explicit detection rules for profile authenticity, message consistency, donation request patterns, and image verification
2. WHILE analyzing content, THE AI Analysis Engine SHALL apply false positive prevention constraints that prevent flagging based solely on low follower counts or political content
3. THE System Prompt SHALL instruct the AI Analysis Engine to generate bilingual output in both English and Hebrew for all summary and reasoning fields
4. THE System Prompt SHALL define structured output requirements including classification, risk score, credibility score, risk factors, credibility factors, and detailed reasoning
5. WHEN test cases that previously produced false positives are reanalyzed, THE AI Analysis Engine SHALL produce improved classification results with measurable accuracy gains

### Requirement 2: Dynamic AI Response Integration

**User Story:** As a user reviewing an analysis report, I want to see the AI's actual risk assessment, credibility evaluation, and reasoning, so that I can understand why content was classified as suspicious or safe.

#### Acceptance Criteria

1. THE AI Analysis Engine SHALL generate numeric risk scores between 0 and 100 for each analysis
2. THE AI Analysis Engine SHALL generate numeric credibility scores between 0 and 100 for each analysis
3. THE AI Analysis Engine SHALL generate detailed reasoning text explaining the classification decision
4. WHEN the analyzeWithGemini function returns an Analysis Result, THE Scam Hunt System SHALL populate riskScore, credibilityScore, and reasoning fields with values from the AI response rather than hardcoded defaults
5. WHEN a user views the analysis panel, THE Scam Hunt System SHALL display the dynamic AI-generated scores and reasoning text

### Requirement 3: Profile Authenticity Tool Implementation

**User Story:** As a user submitting a social media profile for analysis, I want the AI to examine real account metadata like age, follower counts, and activity patterns, so that the scam assessment is based on actual profile characteristics rather than content alone.

#### Acceptance Criteria

1. WHEN the AI Analysis Engine requests profile data via the getUserProfile tool, THE Scam Hunt System SHALL invoke a server-side API route that retrieves real social media account metadata
2. THE Scam Hunt System SHALL create a secure API endpoint at /api/social-lookup that accepts username parameters and returns profile data including account age, follower count, following count, and verification status
3. WHEN the Profile Authenticity Tool returns data, THE AI Analysis Engine SHALL incorporate account metadata into its classification logic
4. THE Scam Hunt System SHALL remove the hardcoded error response that currently blocks the getUserProfile function tool
5. WHEN profile data is unavailable or the API call fails, THE Scam Hunt System SHALL return a structured error response that allows the AI Analysis Engine to proceed with content-only analysis

### Requirement 4: Persistent Feedback and History Storage

**User Story:** As a product owner, I want user feedback and analysis history stored in a persistent database, so that the system can learn from corrections and users can access their past analyses across sessions.

#### Acceptance Criteria

1. WHEN a user submits feedback on an analysis, THE Feedback Service SHALL store the feedback data in Vercel KV with the analysis ID, user ID, rating, and timestamp
2. WHEN a user completes an analysis, THE History Service SHALL store the Analysis Result in Vercel KV associated with the user's unique identifier
3. WHEN a user requests their analysis history, THE History Service SHALL retrieve all past analyses from Vercel KV for that user ID
4. THE Scam Hunt System SHALL create API routes at /api/feedback and /api/history that handle POST and GET operations for feedback and history data
5. WHEN a user returns in a new browser session, THE Scam Hunt System SHALL display their complete analysis history retrieved from Vercel KV

### Requirement 5: Fail-Closed Rate Limiter

**User Story:** As a system administrator, I want the rate limiter to block requests when the database is unavailable, so that the API remains protected from abuse even during infrastructure failures.

#### Acceptance Criteria

1. WHEN Vercel KV is unreachable or returns an error, THE Rate Limiter SHALL reject the incoming request with a 503 Service Unavailable status
2. THE Rate Limiter SHALL log detailed error information including error type, timestamp, and affected endpoint when database failures occur
3. WHEN Vercel KV operations fail, THE Rate Limiter SHALL NOT allow requests to proceed to protected endpoints
4. THE Rate Limiter SHALL return a user-friendly error message indicating temporary service unavailability
5. WHEN Vercel KV connectivity is restored, THE Rate Limiter SHALL resume normal rate limiting operations without requiring application restart
