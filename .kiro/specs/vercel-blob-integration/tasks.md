# Implementation Plan

- [x] 1. Install and configure Vercel Blob package
  - Add @vercel/blob to package.json dependencies
  - Run npm install to update package-lock.json
  - Update .env.example to document BLOB_READ_WRITE_TOKEN
  - Update .env.local.example with Blob configuration
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Create upload API endpoint
- [x] 2.1 Implement /api/upload route
  - Create src/app/api/upload/route.ts
  - Implement POST handler with multipart/form-data support
  - Add file type validation (JPEG, PNG, WebP only)
  - Add file size validation (max 10MB)
  - Integrate Vercel Blob put() function
  - Return JSON response with Blob URL
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 2.2 Add rate limiting to upload endpoint
  - Apply uploadRateLimiter middleware (5 uploads per minute)
  - Return 429 status with retry headers when limit exceeded
  - _Requirements: 2.7_

- [x] 3. Update frontend upload logic
- [x] 3.1 Refactor ChatInterface.tsx
  - Remove createImagePreview() calls for base64 conversion
  - Implement handleFileUpload() function to send file to /api/upload
  - Add loading state during upload
  - Handle upload success and store Blob URL
  - Handle upload errors with user-friendly messages
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3.2 Update useScamAnalysis.ts hook
  - Change imageBase64DataUrl parameter to imageUrl
  - Send Blob URL to /api/analyze instead of base64 data
  - Update request body structure
  - _Requirements: 3.4_

- [x] 4. Update analysis API for Blob URLs
- [x] 4.1 Refactor /api/analyze route
  - Change interface from imageBase64DataUrl to imageUrl
  - Implement image fetching from Blob URL
  - Convert fetched image to base64 for Gemini AI
  - Handle image fetch errors
  - Update cache key generation to use URL instead of base64
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 4.2 Test image analysis with Blob URLs
  - Verify image fetch from Vercel Blob
  - Verify AI analysis with fetched images
  - Test error handling for invalid URLs
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 5. Remove base64 image handling code
- [x] 5.1 Clean up base64 conversion code
  - Remove or deprecate createImagePreview() in src/utils/uploadService.ts
  - Remove base64 parsing logic from /api/analyze
  - Search codebase for "readAsDataURL" and remove unused instances
  - Remove imageBase64DataUrl type definitions
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 5.2 Update TypeScript interfaces
  - Update AnalyzeRequest interface to use imageUrl
  - Update HistoryEntry interface to use imageUrl
  - Remove base64-related type definitions
  - _Requirements: 5.4_

- [x] 6. Update history service for Blob URLs
- [x] 6.1 Update HistoryEntry interface
  - Change input.imageUrl from base64 data URL to Blob URL
  - Update localStorage save logic
  - Update localStorage read logic
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 6.2 Implement legacy base64 handling
  - Add graceful fallback for old history entries with base64
  - Display base64 images inline if they exist
  - Display Blob URL images for new entries
  - _Requirements: 6.4_

- [x] 6.3 Update history export functionality
  - Ensure Blob URLs are included in exports
  - Update export format documentation
  - _Requirements: 6.5_

- [x] 7. Update project documentation
- [x] 7.1 Update README.md
  - Update Architecture section to mention Vercel Blob
  - Add @vercel/blob to Technology Stack
  - Document /api/upload endpoint in API Endpoints section
  - Update image handling description
  - _Requirements: 7.1, 7.2, 7.4_

- [x] 7.2 Update architecture-consolidation spec
  - Update requirements.md to reflect Vercel Blob usage
  - Update design.md to document Blob integration
  - Update tasks.md to mark base64 tasks as superseded
  - _Requirements: 7.3_

- [x] 7.3 Update environment variable documentation
  - Document BLOB_READ_WRITE_TOKEN in .env.example
  - Add setup instructions for local development
  - Note automatic configuration on Vercel deployment
  - _Requirements: 7.5_

- [x] 8. Code quality validation
- [x] 8.1 Run linting and type checking
  - Execute "npm run lint" and fix any errors
  - Execute "npm run type-check" and fix TypeScript errors
  - Execute "npm run format:check" and fix formatting issues
  - Run getDiagnostics on all modified files
  - _Requirements: 8.1, 8.2, 8.4_

- [x] 8.2 Build and verify
  - Execute "npm run build" and ensure successful production build
  - Review build output for warnings or errors
  - Verify @vercel/blob is properly bundled
  - Check for unused imports or dead code
  - _Requirements: 8.3, 8.5_

- [ ] 9. Functional verification testing
- [ ] 9.1 Test image upload flow
  - Upload JPEG, PNG, and WebP images
  - Verify Blob URLs are returned
  - Test file size validation (upload >10MB file)
  - Test file type validation (upload invalid file type)
  - _Requirements: 9.1, 9.5_

- [ ] 9.2 Test image analysis with Blob URLs
  - Submit uploaded image for analysis
  - Verify image is fetched from Blob URL
  - Verify AI analysis completes successfully
  - Test with multiple image types
  - _Requirements: 9.2_

- [ ] 9.3 Test history with Blob URLs
  - Save analysis with Blob URL to localStorage
  - Retrieve history and verify image display
  - Test legacy base64 entries (if any exist)
  - Verify export includes Blob URLs
  - _Requirements: 9.3_

- [ ] 9.4 Test rate limiting
  - Upload 6 images rapidly
  - Verify 6th upload is rate limited
  - Verify 429 response with retry headers
  - Wait for rate limit window to expire and retry
  - _Requirements: 9.4_

- [ ] 9.5 Test error scenarios
  - Test upload with no file
  - Test upload with invalid file type
  - Test upload with oversized file
  - Test analysis with invalid Blob URL
  - Test network failure scenarios
  - _Requirements: 9.5_
