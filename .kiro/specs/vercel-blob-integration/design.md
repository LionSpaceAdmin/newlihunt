# Vercel Blob Integration Design Document

## Overview

This design document outlines the technical approach for integrating Vercel Blob storage into the Scam Hunt Platform for image uploads and storage. The integration replaces the current base64 data URL approach with a dedicated file storage solution, providing better performance, scalability, and user experience while maintaining the Vercel-only architecture.

### Current State Analysis

**Base64 Image Handling Issues:**
- Large request payloads (base64 encoding increases size by ~33%)
- No image persistence or sharing capability
- Inefficient for caching (large cache entries)
- Limited to 10MB images due to request size constraints
- No CDN benefits for image delivery

**Target Architecture:**
- Vercel Blob for image storage with CDN delivery
- Separate upload endpoint for file handling
- Blob URLs for image references
- Efficient caching with URL-based keys
- Maintained Vercel KV for rate limiting and caching
- Maintained localStorage for client-side history

## Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Browser                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Next.js    │  │  localStorage │  │  File Input  │     │
│  │   Frontend   │  │   (History)   │  │  (Images)    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼──────────────────┼────────────┘
          │                  │                  │
          │ HTTPS            │ Read/Write       │ Upload
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼────────────┐
│              Vercel Edge Network (Global CDN)               │
└─────────┬───────────────────┬───────────────────────────────┘
          │                   │
┌─────────▼───────────────────▼───────────────────────────────┐
│           Vercel Serverless Functions (API Routes)          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  /api/upload │  │  /api/analyze│  │/api/url-     │     │
│  │              │  │              │  │ inspector    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘     │
│         │                 │                                 │
│         │ put()           │ fetch() + analyze               │
│         ▼                 ▼                                 │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  Middleware  │  │  Middleware  │                        │
│  │  (Rate Limit)│  │  (Cache)     │                        │
│  └──────┬───────┘  └──────┬───────┘                        │
└─────────┼──────────────────┼──────────────────────────────┘
          │                  │
          │                  │ Read/Write
          ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Vercel KV (Redis)                        │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ Rate Limits  │  │ API Cache    │                        │
│  │ (TTL: 1-15m) │  │ (TTL: 5-60m) │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
          │
          │ Store/Retrieve
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Blob Storage                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Images (JPEG, PNG, WebP)                            │  │
│  │  - Public URLs with CDN                              │  │
│  │  - Automatic optimization                            │  │
│  │  - Global edge delivery                              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
          │
          │ AI Analysis
          ▼
┌─────────────────────────────────────────────────────────────┐
│              Google Gemini AI Service                       │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  Gemini 2.5  │  │  Gemini 2.5  │                        │
│  │  Pro         │  │  Flash       │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Image Upload and Analysis Flow:**
1. User selects image in browser
2. Frontend sends file to /api/upload via multipart/form-data
3. Upload endpoint validates file (type, size)
4. Upload endpoint stores file in Vercel Blob using put()
5. Vercel Blob returns public URL
6. Frontend receives Blob URL
7. Frontend sends analysis request to /api/analyze with Blob URL
8. Analyze endpoint fetches image from Blob URL
9. Analyze endpoint converts to base64 for Gemini AI
10. AI analyzes image and returns results
11. Frontend saves result with Blob URL to localStorage
12. User can view history with images loaded from Blob URLs

## Components and Interfaces

### 1. Upload API Endpoint

**File:** `src/app/api/upload/route.ts`

**Implementation:**

```typescript
import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { uploadRateLimiter } from '@/lib/middleware/rate-limiter';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await uploadRateLimiter.checkRateLimit(request);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many uploads. Please try again later.' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'Retry-After': rateLimitResult.retryAfter!.toString(),
        }
      }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
```

**Key Features:**
- Multipart form data handling
- File type and size validation
- Rate limiting (5 uploads per minute)
- Vercel Blob integration with put()
- Public access with random suffix for uniqueness
- Error handling with appropriate status codes

### 2. Frontend Upload Logic

**File:** `src/components/ChatInterface.tsx`

**Changes:**

```typescript
// Remove base64 conversion
// OLD:
// const base64DataUrl = await createImagePreview(file);

// NEW: Upload to Vercel Blob
const handleFileUpload = async (file: File) => {
  try {
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const data = await response.json();
    setUploadedImageUrl(data.url);
    setIsUploading(false);
    
    return data.url;
  } catch (error) {
    console.error('Upload error:', error);
    setIsUploading(false);
    setError(error instanceof Error ? error.message : 'Upload failed');
    return null;
  }
};
```

**File:** `src/hooks/useScamAnalysis.ts`

**Changes:**

```typescript
// Update analysis request
const requestBody = {
  message: content,
  imageUrl: imageUrl, // Blob URL instead of base64
  conversationHistory: conversationHistory,
};
```

### 3. Analysis API Update

**File:** `src/app/api/analyze/route.ts`

**Changes:**

```typescript
interface AnalyzeRequest {
  message?: string;
  imageUrl?: string; // Changed from imageBase64DataUrl
  conversationHistory: Message[];
}

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, imageUrl, conversationHistory } = body as AnalyzeRequest;

    if (!message && !imageUrl) {
      return NextResponse.json({ error: 'Message or image required' }, { status: 400 });
    }

    const sanitizedMessage = sanitizeText(message || '');

    // Cache key generation (use URL instead of base64)
    const shouldCache = conversationHistory.length === 0;
    let cacheKey: string | undefined;

    if (shouldCache) {
      const cacheContent = imageUrl ? `${sanitizedMessage}:${imageUrl}` : sanitizedMessage;
      cacheKey = `analysis:cache:${crypto.createHash('sha256').update(cacheContent).digest('hex')}`;

      try {
        const cachedResult = await kv.get(cacheKey);
        if (cachedResult) {
          return NextResponse.json(cachedResult);
        }
      } catch (error) {
        console.warn('Cache read error:', error);
      }
    }

    // Fetch and convert image if URL provided
    let base64: string | undefined;
    let mimeType: string | undefined;

    if (imageUrl) {
      try {
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          return NextResponse.json({ error: 'Failed to fetch image' }, { status: 400 });
        }

        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        base64 = buffer.toString('base64');
        mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

        if (!mimeType.startsWith('image/')) {
          return NextResponse.json({ error: 'Invalid image type' }, { status: 400 });
        }
      } catch (error) {
        console.error('Image fetch error:', error);
        return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
      }
    }

    const history = conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const result = await analyzeWithGemini(sanitizedMessage, history, base64, mimeType);

    // Cache the result
    if (shouldCache && cacheKey) {
      try {
        await kv.set(cacheKey, result, { ex: 300 });
      } catch (error) {
        console.warn('Cache write error:', error);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
```

### 4. History Service Update

**File:** `src/lib/history-service.ts`

**Changes:**

```typescript
export interface HistoryEntry {
  id: string;
  userId: string;
  timestamp: Date;
  analysis: FullAnalysisResult;
  conversation: Message[];
  input: {
    message: string;
    imageUrl?: string; // Changed from base64 data URL to Blob URL
  };
  processingTime: number;
  userAgent?: string;
}
```

### 5. Upload Service Cleanup

**File:** `src/utils/uploadService.ts`

**Keep validation functions, remove or update base64 conversion:**

```typescript
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Please upload JPEG, PNG, or WebP images only.',
    };
  }

  const maxSize = 10 * 1024 * 1024; // 10MB

  if (file.size > maxSize) {
    return { isValid: false, error: 'File too large. Maximum size is 10MB.' };
  }

  return { isValid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' bytes';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Remove or mark as deprecated:
// export function createImagePreview(file: File): Promise<string> { ... }
```

## Data Models

### Upload Response

```typescript
interface UploadResponse {
  success: boolean;
  url: string;      // Vercel Blob public URL
  size: number;     // File size in bytes
  type: string;     // MIME type
  error?: string;   // Error message if failed
}
```

### Analyze Request (Updated)

```typescript
interface AnalyzeRequest {
  message?: string;
  imageUrl?: string;  // Blob URL instead of base64
  conversationHistory: Message[];
}
```

## Error Handling

### Upload Failures

**Strategy:** Clear error messages with retry guidance

**Scenarios:**
- File too large: "File too large. Maximum size is 10MB."
- Invalid type: "Invalid file type. Only JPEG, PNG, and WebP are allowed."
- Rate limit: "Too many uploads. Please try again in X seconds."
- Network error: "Upload failed. Please check your connection and try again."
- Blob storage error: "Failed to upload file. Please try again later."

### Image Fetch Failures

**Strategy:** Graceful degradation

**Scenarios:**
- URL not accessible: Return error to user, suggest re-upload
- Invalid image format: Validate before analysis
- Network timeout: Retry once, then fail with message

## Security Considerations

### Upload Endpoint Security

1. **Rate Limiting**: 5 uploads per minute per IP
2. **File Validation**: Type and size checks before upload
3. **MIME Type Verification**: Server-side validation
4. **Random Suffixes**: Prevent filename collisions and guessing
5. **Public Access**: Images are publicly accessible (no sensitive data)

### Blob URL Security

1. **HTTPS Only**: All Blob URLs use HTTPS
2. **CDN Delivery**: Vercel's global CDN for performance
3. **No Authentication**: Public access for simplicity (images are not sensitive)
4. **URL Expiration**: Consider implementing expiration for temporary images (future enhancement)

## Performance Optimizations

### Upload Performance

- **Direct Upload**: Client uploads directly to Vercel Blob via API
- **Streaming**: Use streaming for large files (future enhancement)
- **Compression**: Client-side image compression before upload (future enhancement)

### Analysis Performance

- **Caching**: Cache analysis results with URL-based keys
- **CDN**: Vercel Blob uses CDN for fast image delivery
- **Lazy Loading**: Load images on-demand in history view

## Migration Strategy

### Handling Existing Base64 History

**Option 1: Ignore Legacy Entries**
- Display message: "Image not available (legacy format)"
- Only new analyses use Blob URLs

**Option 2: Graceful Fallback**
- Check if imageUrl starts with "data:"
- If yes, display inline base64 image
- If no, fetch from Blob URL

**Recommended: Option 2** for better user experience

```typescript
// In history display component
const getImageSrc = (entry: HistoryEntry) => {
  if (!entry.input.imageUrl) return null;
  
  // Legacy base64 format
  if (entry.input.imageUrl.startsWith('data:')) {
    return entry.input.imageUrl;
  }
  
  // New Blob URL format
  return entry.input.imageUrl;
};
```

## Testing Strategy

### Unit Tests

- Upload endpoint validation logic
- File type and size validation
- Error handling scenarios

### Integration Tests

- End-to-end upload flow
- Image analysis with Blob URLs
- History storage and retrieval
- Rate limiting enforcement

### Manual Testing

- Upload various image types and sizes
- Test rate limiting by rapid uploads
- Verify image display in history
- Test error scenarios (network failures, invalid files)

## Deployment Checklist

1. ✅ Install @vercel/blob package
2. ✅ Create /api/upload endpoint
3. ✅ Update frontend upload logic
4. ✅ Update /api/analyze to fetch from Blob URLs
5. ✅ Update history service interface
6. ✅ Remove base64 conversion code
7. ✅ Update documentation
8. ✅ Set BLOB_READ_WRITE_TOKEN in Vercel dashboard
9. ✅ Test upload and analysis flow
10. ✅ Deploy to production
