# Requirements Document

## Introduction

The Scam Hunt Platform currently uses base64 data URLs for image handling, which was implemented as part of the AWS infrastructure removal. However, a Vercel Blob store (lionscamhunt-blob) has been provisioned in the Vercel dashboard, indicating an architectural decision to use dedicated file storage for images. This specification defines requirements for refactoring the platform to use Vercel Blob for image uploads and storage, replacing the base64 approach while maintaining the Vercel-only architecture with Vercel KV for rate limiting and caching, and localStorage for client-side history.

## Glossary

- **Platform**: The Scam Hunt Platform application
- **Vercel Blob**: Vercel's object storage service for files and media
- **Vercel KV**: Vercel's Redis-compatible key-value storage service (for rate limiting and caching)
- **Base64 Data URL**: Encoded image data embedded directly in API requests (current approach)
- **Blob URL**: Public URL pointing to an image stored in Vercel Blob
- **Upload Endpoint**: API route that handles file uploads to Vercel Blob
- **BLOB_READ_WRITE_TOKEN**: Environment variable for Vercel Blob authentication
- **Client-Side Storage**: Browser-based localStorage for user-specific data

## Requirements

### Requirement 1: Vercel Blob Package Integration

**User Story:** As a developer, I want the @vercel/blob package installed and configured, so that the platform can upload and retrieve images from Vercel Blob storage.

#### Acceptance Criteria

1. WHEN package.json dependencies are reviewed, THE Platform SHALL have @vercel/blob package added to dependencies
2. WHEN npm install is executed, THE Platform SHALL successfully install @vercel/blob and update package-lock.json
3. WHEN environment variables are checked, THE Platform SHALL require BLOB_READ_WRITE_TOKEN for Vercel Blob authentication
4. WHEN .env.example is reviewed, THE Platform SHALL document BLOB_READ_WRITE_TOKEN as an optional variable for local development
5. WHEN deployed to Vercel, THE Platform SHALL automatically receive BLOB_READ_WRITE_TOKEN from Vercel environment

### Requirement 2: Image Upload API Implementation

**User Story:** As a user, I want to upload images to secure cloud storage, so that my images are stored reliably and can be accessed efficiently.

#### Acceptance Criteria

1. WHEN /api/upload endpoint is created, THE Platform SHALL accept multipart/form-data file uploads
2. WHEN a file is uploaded, THE Platform SHALL validate file type (JPEG, PNG, WebP only)
3. WHEN a file is uploaded, THE Platform SHALL validate file size (maximum 10MB)
4. WHEN validation passes, THE Platform SHALL upload the file to Vercel Blob using put() function
5. WHEN upload succeeds, THE Platform SHALL return a JSON response with the Blob URL
6. WHEN upload fails, THE Platform SHALL return appropriate error messages with HTTP status codes
7. WHEN rate limiting is applied, THE Platform SHALL limit uploads to 5 per minute per IP

### Requirement 3: Frontend Image Upload Refactoring

**User Story:** As a user, I want to upload images through the chat interface, so that I can analyze suspicious images for scams.

#### Acceptance Criteria

1. WHEN a user selects an image in ChatInterface.tsx, THE Platform SHALL send the file to /api/upload endpoint
2. WHEN upload is in progress, THE Platform SHALL display a loading indicator
3. WHEN upload succeeds, THE Platform SHALL receive the Blob URL from the response
4. WHEN Blob URL is received, THE Platform SHALL send it to /api/analyze for AI analysis
5. WHEN upload fails, THE Platform SHALL display an error message to the user

### Requirement 4: Analysis API Image Handling Update

**User Story:** As a developer, I want the analysis API to fetch images from Vercel Blob URLs, so that the AI can analyze images stored in cloud storage.

#### Acceptance Criteria

1. WHEN /api/analyze receives a request with imageUrl, THE Platform SHALL fetch the image from the Blob URL
2. WHEN image is fetched, THE Platform SHALL convert it to base64 for Gemini AI processing
3. WHEN image fetch fails, THE Platform SHALL return an appropriate error response
4. WHEN imageBase64DataUrl parameter is removed, THE Platform SHALL no longer accept inline base64 images
5. WHEN caching is implemented, THE Platform SHALL use image URL (not base64) in cache key generation

### Requirement 5: Base64 Code Removal

**User Story:** As a developer, I want all base64 image handling code removed, so that the codebase has a single, consistent approach to image handling.

#### Acceptance Criteria

1. WHEN useScamAnalysis.ts is reviewed, THE Platform SHALL remove base64 data URL generation logic
2. WHEN ChatInterface.tsx is reviewed, THE Platform SHALL remove createImagePreview() calls for base64 conversion
3. WHEN /api/analyze is reviewed, THE Platform SHALL remove base64 data URL parsing logic
4. WHEN src/utils/uploadService.ts is reviewed, THE Platform SHALL remove or update createImagePreview() function
5. WHEN code is searched for "readAsDataURL", THE Platform SHALL have no remaining base64 conversion for image uploads

### Requirement 6: History Service Image URL Update

**User Story:** As a user, I want my analysis history to reference images by URL, so that I can view past analyses with their associated images.

#### Acceptance Criteria

1. WHEN HistoryEntry interface is reviewed, THE Platform SHALL use imageUrl (Blob URL) instead of base64 data URL
2. WHEN analysis is saved to localStorage, THE Platform SHALL store the Blob URL
3. WHEN history is retrieved, THE Platform SHALL display images using Blob URLs
4. WHEN old history entries with base64 exist, THE Platform SHALL handle them gracefully (migration or ignore)
5. WHEN history is exported, THE Platform SHALL include Blob URLs in the export data

### Requirement 7: Documentation Updates

**User Story:** As a new developer, I want documentation to accurately describe Vercel Blob image handling, so that I understand the current architecture.

#### Acceptance Criteria

1. WHEN README.md Architecture section is read, THE Platform SHALL describe Vercel Blob for image storage
2. WHEN README.md Technology Stack is reviewed, THE Platform SHALL list @vercel/blob in dependencies
3. WHEN .kiro/specs/architecture-consolidation/ documents are reviewed, THE Platform SHALL be updated to reflect Vercel Blob usage
4. WHEN API documentation is read, THE Platform SHALL document /api/upload endpoint
5. WHEN environment variable documentation is reviewed, THE Platform SHALL document BLOB_READ_WRITE_TOKEN

### Requirement 8: Code Quality and Testing

**User Story:** As a quality assurance engineer, I want the refactored code to pass all quality checks, so that the Vercel Blob integration maintains production standards.

#### Acceptance Criteria

1. WHEN "npm run lint" is executed, THE Platform SHALL complete without errors
2. WHEN "npm run type-check" is executed, THE Platform SHALL complete without TypeScript errors
3. WHEN "npm run build" is executed, THE Platform SHALL produce a successful production build
4. WHEN getDiagnostics is run on modified files, THE Platform SHALL report zero critical errors
5. WHEN code is reviewed, THE Platform SHALL have no unused imports or dead code related to base64 handling

### Requirement 9: Functional Verification

**User Story:** As an end user, I want image upload and analysis to work seamlessly, so that I can detect scams in images without technical issues.

#### Acceptance Criteria

1. WHEN a user uploads an image, THE Platform SHALL successfully store it in Vercel Blob
2. WHEN a user submits an uploaded image for analysis, THE Platform SHALL retrieve it from Vercel Blob and analyze it
3. WHEN a user views history with images, THE Platform SHALL display images from Vercel Blob URLs
4. WHEN rate limiting is triggered on uploads, THE Platform SHALL enforce the 5 uploads per minute limit
5. WHEN an invalid file is uploaded, THE Platform SHALL display appropriate validation errors
