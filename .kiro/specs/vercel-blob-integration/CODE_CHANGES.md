# Code Changes Required for Vercel Blob Integration

This document outlines all code changes needed to integrate Vercel Blob storage.

## 1. Package Installation

### package.json
```bash
npm install @vercel/blob
```

Add to dependencies:
```json
{
  "dependencies": {
    "@vercel/blob": "^0.23.0"
  }
}
```

## 2. New Files to Create

### src/app/api/upload/route.ts (NEW FILE)
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
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
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
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
```

## 3. Files to Modify

### src/app/api/analyze/route.ts

**Change interface:**
```typescript
// OLD
interface AnalyzeRequest {
  message?: string;
  imageBase64DataUrl?: string;
  conversationHistory: Message[];
}

// NEW
interface AnalyzeRequest {
  message?: string;
  imageUrl?: string;  // Blob URL
  conversationHistory: Message[];
}
```

**Update handlePOST function:**
```typescript
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

### src/components/ChatInterface.tsx

**Add upload function:**
```typescript
const [isUploading, setIsUploading] = useState(false);
const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

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

**Update file selection handler:**
```typescript
// OLD - Remove this
// const base64DataUrl = await createImagePreview(file);

// NEW - Use this
const imageUrl = await handleFileUpload(file);
if (imageUrl) {
  // Store URL for analysis
  setUploadedImageUrl(imageUrl);
}
```

### src/hooks/useScamAnalysis.ts

**Update request body:**
```typescript
// OLD
const requestBody = {
  message: content,
  imageBase64DataUrl: imageUrl,
  conversationHistory: conversationHistory,
};

// NEW
const requestBody = {
  message: content,
  imageUrl: imageUrl,  // Now a Blob URL
  conversationHistory: conversationHistory,
};
```

### src/lib/history-service.ts

**Update interface:**
```typescript
export interface HistoryEntry {
  id: string;
  userId: string;
  timestamp: Date;
  analysis: FullAnalysisResult;
  conversation: Message[];
  input: {
    message: string;
    imageUrl?: string;  // Changed from base64 to Blob URL
  };
  processingTime: number;
  userAgent?: string;
}
```

**Add legacy handling (optional):**
```typescript
// Helper function to check if URL is base64
const isBase64Image = (url: string) => url.startsWith('data:image/');

// In display components
const getImageSrc = (entry: HistoryEntry) => {
  if (!entry.input.imageUrl) return null;
  
  // Support both legacy base64 and new Blob URLs
  return entry.input.imageUrl;
};
```

## 4. Files to Clean Up

### src/utils/uploadService.ts

**Remove or deprecate:**
```typescript
// REMOVE THIS FUNCTION
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

**Keep validation functions:**
```typescript
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  // Keep this - still useful
}

export function formatFileSize(bytes: number): string {
  // Keep this - still useful
}
```

## 5. Environment Variables

### .env.example
```bash
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Vercel Blob (automatically configured on Vercel)
# For local development, get from Vercel dashboard:
# BLOB_READ_WRITE_TOKEN=your_blob_token_here
```

### .env.local.example
```bash
# Copy this file to .env.local and fill in your values

# Required: Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Vercel Blob Configuration (for local development)
# Get these from your Vercel dashboard under Storage > Blob
# BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx
```

## 6. TypeScript Type Updates

### src/types/analysis.ts (if exists)

Update any type definitions that reference `imageBase64DataUrl` to use `imageUrl` instead.

## 7. Search and Replace

Run these searches to find remaining base64 references:

```bash
# Find base64 image handling
grep -r "imageBase64DataUrl" src/
grep -r "readAsDataURL" src/
grep -r "createImagePreview" src/
grep -r "data:image/" src/

# Find and update all occurrences
```

## 8. Testing Checklist

After making changes:

- [ ] `npm install` - Install @vercel/blob
- [ ] `npm run type-check` - Verify TypeScript
- [ ] `npm run lint` - Check linting
- [ ] `npm run build` - Test production build
- [ ] Manual test: Upload image
- [ ] Manual test: Analyze uploaded image
- [ ] Manual test: View history with images
- [ ] Manual test: Rate limiting (6 rapid uploads)

## 9. Deployment

1. Push changes to repository
2. Vercel will automatically deploy
3. Verify `BLOB_READ_WRITE_TOKEN` is set in Vercel dashboard (should be automatic)
4. Test upload functionality in production

## Summary of Changes

- ✅ Add @vercel/blob package
- ✅ Create /api/upload endpoint
- ✅ Update /api/analyze to fetch from Blob URLs
- ✅ Update ChatInterface.tsx for file upload
- ✅ Update useScamAnalysis.ts request body
- ✅ Update HistoryEntry interface
- ✅ Remove base64 conversion code
- ✅ Update environment variable documentation
- ✅ Test all functionality
