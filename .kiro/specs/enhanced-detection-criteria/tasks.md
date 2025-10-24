# Implementation Plan

- [x] 1. Update AI Analysis Engine with LionsOfZion v1.3 Detection Criteria
  - Modify the system prompt in gemini-service.ts to include complete v1.3 criteria
  - Implement dual-scoring logic with separate Risk and Credibility calculations
  - Add classification matrix for final decision-making
  - _Requirements: 1.1, 3.1, 3.2, 3.3, 4.1, 8.1, 8.2_

- [x] 1.1 Update system prompt with legitimate signals
  - Add all legitimate signal definitions to SYSTEM_PROMPT constant
  - Include point values for each legitimate signal (account age +10, content diversity +8, etc.)
  - Document that legitimate signals boost Credibility Score
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

- [x] 1.2 Add de-biasing rules to system prompt
  - Include explicit de-biasing instructions for anonymous profiles
  - Add de-biasing rules for patriotic symbols and expressions
  - Specify that focus should be on behavioral signals, not aesthetics
  - Document de-biasing status tracking requirements
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 1.3 Implement classification matrix in system prompt
  - Define the 2x2 matrix (Risk Score vs Credibility Score)
  - Specify classification outcomes: Fake/Scam, Suspicious, Authentic, Trusted
  - Include action recommendations: Flag & Remove, Manual Review, Approve, Safe
  - Add evidence list requirements for transparency
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 1.4 Add reverse image intelligence instructions
  - Include reverse image search verification requirements
  - Define risk points for stolen, AI-generated, or mismatched images (+12 points)
  - Define credibility points for unique, original images (+10 points)
  - Specify evidence documentation for image findings
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 1.5 Update suspicious vs fake signal definitions
  - Clearly distinguish moderate risk (Suspicious) from high risk (Fake) signals
  - Add suspicious signal point values (3-5 points)
  - Add fake signal point values (7-15 points)
  - Include manual review triggers for suspicious classifications
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

- [x] 2. Update TypeScript types for enhanced analysis results
  - Modify analysis.ts types to support dual scoring
  - Add classification matrix types and evidence structures
  - Ensure backward compatibility with existing code
  - _Requirements: 3.6, 8.5, 9.1, 9.2_

- [x] 2.1 Add Credibility Score to AnalysisData interface
  - Update AnalysisData interface to include credibilityScore field
  - Ensure riskScore and credibilityScore are both present
  - Add JSDoc comments explaining the dual-score framework
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 2.2 Expand Classification enum with new categories
  - Add "TRUSTED" classification for low risk + high credibility
  - Add "AUTHENTIC" classification for medium risk + high credibility
  - Keep existing SAFE, SUSPICIOUS, HIGH_RISK for compatibility
  - Map old classifications to new matrix outcomes
  - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [x] 2.3 Enhance DetectedRule interface for signal categorization
  - Add category field to distinguish Legitimate, Suspicious, Fake signals
  - Update points field to support both positive (credibility) and negative (risk) values
  - Add optional imageIntelligence field for reverse image findings
  - _Requirements: 9.2, 9.3, 9.4, 9.5_

- [x] 3. Update Analysis Panel to display dual scores
  - Modify AnalysisPanel component to show both Risk and Credibility scores
  - Add visual distinction between risk and credibility gauges
  - Update color coding to reflect classification matrix
  - _Requirements: 3.6, 9.1_

- [x] 3.1 Add Credibility Score gauge to AnalysisPanel
  - Create second gauge component for Credibility Score display
  - Use green color scheme for credibility (vs red for risk)
  - Position gauges side-by-side or stacked based on screen size
  - Add labels explaining what each score represents
  - _Requirements: 3.6_

- [x] 3.2 Update classification display with matrix outcomes
  - Show classification result (Trusted, Authentic, Suspicious, Fake/Scam)
  - Display recommended action (Safe, Approve, Manual Review, Flag & Remove)
  - Add visual indicators matching classification severity
  - _Requirements: 4.6, 9.1_

- [x] 3.3 Enhance evidence list with signal categorization
  - Group detected signals by category (Legitimate, Suspicious, Fake)
  - Use color coding: green for legitimate, yellow for suspicious, red for fake
  - Show point contribution for each signal (+/- values)
  - Add expand/collapse for detailed signal descriptions
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 4. Update validation and response parsing
  - Modify analyzeScam function to validate dual scores
  - Update JSON parsing to extract credibilityScore
  - Add validation for classification matrix outcomes
  - _Requirements: 8.3, 8.4, 8.5_

- [x] 4.1 Update validateClassification function
  - Add validation for new classification values (TRUSTED, AUTHENTIC)
  - Ensure backward compatibility with existing classifications
  - Add fallback logic for invalid classifications
  - _Requirements: 4.1, 8.5_

- [x] 4.2 Enhance validateDetectedRules function
  - Validate signal category field (Legitimate, Suspicious, Fake)
  - Check that points are positive for credibility, can be either for risk
  - Validate imageIntelligence field when present
  - _Requirements: 9.2, 9.3_

- [x] 4.3 Add credibilityScore extraction and validation
  - Extract credibilityScore from AI JSON response
  - Validate score is between 0-100
  - Provide default value (50) if missing for backward compatibility
  - _Requirements: 3.1, 3.2, 8.5_

- [ ]\* 5. Add comprehensive testing for enhanced detection
  - Create test cases for legitimate profiles (should score high credibility)
  - Create test cases for suspicious profiles (should trigger manual review)
  - Create test cases for fake profiles (should score high risk)
  - Validate de-biasing rules prevent false positives
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ]\* 5.1 Create test cases for legitimate profiles
  - Test old account with consistent activity (should be Trusted/Authentic)
  - Test profile with diverse content and no donation requests
  - Test profile with natural language and genuine interactions
  - Verify high Credibility Score and low Risk Score
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 10.3_

- [ ]\* 5.2 Create test cases for de-biasing rules
  - Test anonymous profile with good behavior (should not be penalized)
  - Test profile with Israeli flags and patriotic content (should not increase risk)
  - Verify debiasingStatus fields are properly set
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 10.3_

- [ ]\* 5.3 Create test cases for classification matrix
  - Test high risk + low credibility → Fake/Scam classification
  - Test high risk + high credibility → Suspicious classification
  - Test medium risk + high credibility → Authentic classification
  - Test low risk + high credibility → Trusted classification
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 10.3_

- [ ]\* 5.4 Create test cases for reverse image intelligence
  - Test with stolen/reused image (should add risk points)
  - Test with AI-generated image (should add risk points)
  - Test with unique original image (should add credibility points)
  - Verify image findings appear in evidence list
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 10.3_

- [ ]\* 5.5 Create test cases for suspicious vs fake signals
  - Test new account with human behavior (should be Suspicious, not Fake)
  - Test profile with donation requests (should be Fake)
  - Test profile with partial template language (should be Suspicious)
  - Verify appropriate actions are recommended
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 10.3_

- [x] 6. Update documentation and version metadata
  - Update inline code comments with v1.3 criteria references
  - Add version field to analysis metadata
  - Update API documentation with new response format
  - _Requirements: 8.5, 10.1, 10.4, 10.5_

- [x] 6.1 Add version tracking to analysis results
  - Set version field to "v1.3" in all analysis metadata
  - Document criteria version in system prompt
  - Add changelog entry for v1.3 detection criteria
  - _Requirements: 8.5, 10.5_

- [x] 6.2 Update code documentation
  - Add JSDoc comments explaining dual-score framework
  - Document classification matrix logic
  - Add examples of legitimate vs fake signals
  - Document de-biasing rules and their purpose
  - _Requirements: 10.1, 10.4_

- [x] 6.3 Create migration guide for existing analyses
  - Document how old single-score analyses map to dual-score
  - Explain backward compatibility approach
  - Provide examples of before/after analysis results
  - _Requirements: 8.5, 10.1_
