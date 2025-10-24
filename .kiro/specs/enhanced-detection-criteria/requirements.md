# Requirements Document

## Introduction

The Enhanced Detection Criteria feature implements the LionsOfZion Official Detection Criteria (v1.3) to significantly reduce false positives in IDF soldier impersonation scam detection. The system addresses the critical issue where legitimate profiles are incorrectly flagged as suspicious by introducing a sophisticated dual-scoring framework, de-biasing rules, legitimate signal detection, and a classification matrix that considers both risk and credibility factors. This enhancement applies to both IDF and Ukrainian soldier impersonation scams.

## Glossary

- **LionsOfZion Criteria v1.3**: The official detection framework with dual scoring, de-biasing, and classification matrix
- **Risk Score**: Numerical score (0-100) representing scam indicators, where higher values indicate greater danger
- **Credibility Score**: Numerical score (0-100) representing legitimacy indicators, where higher values indicate greater trustworthiness
- **Classification Matrix**: Decision framework that combines Risk Score and Credibility Score to determine final classification
- **De-biasing Rules**: Rules that prevent false positives by neutralizing non-indicative factors like profile anonymity or patriotic symbols
- **Legitimate Signals**: Positive indicators that boost Credibility Score, such as account age, content diversity, and natural language
- **Suspicious Signals**: Moderate risk indicators that trigger manual review rather than automatic flagging
- **Fake Signals**: High-risk indicators that strongly suggest impersonation or scam activity
- **Reverse Image Intelligence**: Image verification process using web-based reverse image search to detect stolen, AI-generated, or reused photos
- **AI Analysis Engine**: The Google Gemini-powered backend service that applies detection criteria
- **Behavioral Signals**: Patterns in account activity, messaging, and interaction that indicate authenticity or fraud

## Requirements

### Requirement 1

**User Story:** As a user submitting a legitimate pro-Israel profile for analysis, I want the system to recognize authentic signals, so that I am not falsely flagged as a scammer.

#### Acceptance Criteria

1. THE AI Analysis Engine SHALL calculate a Credibility Score (0-100) based on legitimate signals for every analysis
2. WHEN an account shows significant age (pre-2023 or consistent long-term activity), THE AI Analysis Engine SHALL add 10 points to the Credibility Score
3. WHEN content shows diversity (posts, replies, visuals, tone variety), THE AI Analysis Engine SHALL add 8 points to the Credibility Score
4. WHEN an account has no donation, crypto, or "DM for help" requests, THE AI Analysis Engine SHALL add 10 points to the Credibility Score
5. WHEN images are unique and original (not AI-generated or reused), THE AI Analysis Engine SHALL add 10 points to the Credibility Score
6. WHEN language is natural and not templated or repetitive, THE AI Analysis Engine SHALL add 6 points to the Credibility Score
7. THE AI Analysis Engine SHALL recognize steady, natural posting cadence as a legitimate signal worth 8 credibility points
8. WHEN genuine interactions with trusted or verified Israeli accounts are detected, THE AI Analysis Engine SHALL add 6 points to the Credibility Score

### Requirement 2

**User Story:** As a user with an anonymous profile or patriotic content, I want the system to not penalize me for these neutral characteristics, so that I receive a fair assessment.

#### Acceptance Criteria

1. THE AI Analysis Engine SHALL implement de-biasing rules that neutralize non-indicative factors
2. WHEN a profile lacks a photo or uses anonymity, THE AI Analysis Engine SHALL NOT deduct points from either Risk or Credibility Score
3. WHEN a profile uses Israeli flag emojis (🇮🇱) or phrases like "Am Yisrael Chai", THE AI Analysis Engine SHALL NOT increase Risk Score
4. THE AI Analysis Engine SHALL focus on behavioral signals rather than aesthetic or emotional tone
5. THE AI Analysis Engine SHALL document which de-biasing rules were applied in the debiasingStatus field

### Requirement 3

**User Story:** As a system analyst reviewing detection accuracy, I want separate Risk and Credibility scores, so that I can understand both the danger level and trustworthiness independently.

#### Acceptance Criteria

1. THE AI Analysis Engine SHALL calculate both Risk Score (0-100) and Credibility Score (0-100) for every analysis
2. THE AI Analysis Engine SHALL sum all risk signal points to generate Risk Score with maximum of 100
3. THE AI Analysis Engine SHALL sum all credibility signal points to generate Credibility Score with maximum of 100
4. THE AI Analysis Engine SHALL classify Risk Score as High (>60), Medium (30-60), or Low (<30)
5. THE AI Analysis Engine SHALL classify Credibility Score as High (>70), Medium (40-70), or Low (<40)
6. THE Analysis Panel SHALL display both scores prominently with separate visual gauges

### Requirement 4

**User Story:** As a user receiving an analysis result, I want the final classification to consider both risk and credibility, so that the decision is balanced and accurate.

#### Acceptance Criteria

1. THE AI Analysis Engine SHALL apply the classification matrix to determine final classification
2. WHEN Risk Score is High AND Credibility Score is Low, THE AI Analysis Engine SHALL classify as "Fake / Scam" with action "Flag & Remove"
3. WHEN Risk Score is High AND Credibility Score is High, THE AI Analysis Engine SHALL classify as "Suspicious" with action "Manual Review"
4. WHEN Risk Score is Medium AND Credibility Score is High, THE AI Analysis Engine SHALL classify as "Authentic" with action "Approve"
5. WHEN Risk Score is Low AND Credibility Score is High, THE AI Analysis Engine SHALL classify as "Trusted" with action "Safe"
6. THE AI Analysis Engine SHALL provide evidence list explaining which signals contributed to the classification

### Requirement 5

**User Story:** As a user analyzing a profile with images, I want the system to verify image authenticity through reverse image search, so that stolen or AI-generated photos are detected.

#### Acceptance Criteria

1. WHEN an image is provided for analysis, THE AI Analysis Engine SHALL perform reverse image intelligence checks
2. IF an image is found on multiple accounts or mismatched contexts, THE AI Analysis Engine SHALL add 12 points to Risk Score
3. IF an image shows mismatched IDF uniform details or appears AI-generated, THE AI Analysis Engine SHALL add 12 points to Risk Score
4. IF an image is found on stock photo sites or known scam sources, THE AI Analysis Engine SHALL add 12 points to Risk Score
5. WHEN an image is unique and original, THE AI Analysis Engine SHALL add 10 points to Credibility Score
6. THE AI Analysis Engine SHALL document reverse image findings in the evidence list

### Requirement 6

**User Story:** As a user encountering a new account with human-like behavior, I want the system to flag it for manual review rather than automatic rejection, so that legitimate new users are not unfairly blocked.

#### Acceptance Criteria

1. THE AI Analysis Engine SHALL distinguish between Suspicious Signals (moderate risk) and Fake Signals (high risk)
2. WHEN a new account shows human-like behavior, THE AI Analysis Engine SHALL add 5 risk points and classify as Suspicious
3. WHEN an account has no photo or bio but consistent posting, THE AI Analysis Engine SHALL add 4 risk points and classify as Suspicious
4. WHEN patriotic symbols appear without donation links, THE AI Analysis Engine SHALL add 3 risk points and classify as Suspicious
5. WHEN language is partially template-like, THE AI Analysis Engine SHALL add 4 risk points and classify as Suspicious
6. THE AI Analysis Engine SHALL recommend "Manual Review" action for Suspicious classifications

### Requirement 7

**User Story:** As a user analyzing a profile with clear scam indicators, I want the system to detect high-risk signals accurately, so that dangerous accounts are properly flagged.

#### Acceptance Criteria

1. THE AI Analysis Engine SHALL detect high-risk fake signals and assign appropriate risk points
2. WHEN money, crypto, or "support soldiers" requests are detected, THE AI Analysis Engine SHALL add 15 points to Risk Score
3. WHEN claims as IDF soldier or injured with donation requests are detected, THE AI Analysis Engine SHALL add 12 points to Risk Score
4. WHEN reused or stolen images across accounts are detected, THE AI Analysis Engine SHALL add 10 points to Risk Score
5. WHEN repetitive openers like "Thank you for supporting Israel..." are detected, THE AI Analysis Engine SHALL add 8 points to Risk Score
6. WHEN new account with follow or engagement burst is detected, THE AI Analysis Engine SHALL add 8 points to Risk Score
7. WHEN Telegram, WhatsApp, or fundraising links are detected, THE AI Analysis Engine SHALL add 10 points to Risk Score
8. WHEN inconsistent identity (non-native errors, wrong claims) is detected, THE AI Analysis Engine SHALL add 7 points to Risk Score

### Requirement 8

**User Story:** As a system administrator, I want the enhanced detection criteria to be applied consistently across all analysis requests, so that all users benefit from improved accuracy.

#### Acceptance Criteria

1. THE AI Analysis Engine SHALL update the system prompt to include complete LionsOfZion v1.3 criteria
2. THE AI Analysis Engine SHALL apply legitimate signals, suspicious signals, and fake signals consistently
3. THE AI Analysis Engine SHALL apply de-biasing rules to every analysis without exception
4. THE AI Analysis Engine SHALL use the classification matrix for all final classifications
5. THE AI Analysis Engine SHALL maintain backward compatibility with existing analysis result format

### Requirement 9

**User Story:** As a user reviewing analysis results, I want to see which specific signals were detected and how they contributed to scores, so that I can understand the reasoning.

#### Acceptance Criteria

1. THE Analysis Panel SHALL display a detailed evidence list showing all detected signals
2. THE AI Analysis Engine SHALL categorize detected signals as Legitimate, Suspicious, or Fake
3. THE AI Analysis Engine SHALL show point values for each detected signal
4. THE AI Analysis Engine SHALL provide clear descriptions for each detected signal
5. THE Analysis Panel SHALL visually distinguish between risk-increasing and credibility-increasing signals

### Requirement 10

**User Story:** As a developer maintaining the system, I want the enhanced criteria to be well-documented and testable, so that future updates maintain detection accuracy.

#### Acceptance Criteria

1. THE AI Analysis Engine SHALL include comprehensive inline documentation for all detection rules
2. THE system SHALL provide example inputs and expected outputs for each classification category
3. THE system SHALL include test cases covering legitimate profiles, suspicious profiles, and fake profiles
4. THE AI Analysis Engine SHALL log detection decisions with sufficient detail for debugging
5. THE system SHALL version the detection criteria (v1.3) in all analysis metadata
