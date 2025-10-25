# 📡 API Documentation - Scam Hunt Platform

## Base URL
- **Production:** https://lionsofzion.io
- **Development:** http://localhost:3000

---

## 🔐 Authentication
No authentication required. Rate limiting is IP-based.

---

## 📤 POST /api/upload

Upload an image to Vercel Blob storage.

### Request

**Content-Type:** `multipart/form-data`

**Body:**
```
file: File (image/jpeg, image/png, image/webp)
```

**Limits:**
- Max file size: 10MB
- Allowed types: JPEG, PNG, WebP
- Rate limit: 5 uploads per minute per IP

### Response

**Success (200):**
```json
{
  "success": true,
  "url": "https://blob.vercel-storage.com/image-abc123.jpg",
  "size": 1048576,
  "type": "image/jpeg"
}
```

**Error (400):**
```json
{
  "error": "Invalid file type. Only JPEG, PNG, and WebP are allowed."
}
```

**Error (429):**
```json
{
  "error": "Too many uploads. Please try again later.",
  "retryAfter": 60
}
```

### Example

```javascript
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
console.log(data.url); // Blob URL
```

---

## 🔍 POST /api/analyze

Analyze text or image for scam detection.

### Request

**Content-Type:** `application/json`

**Body:**
```json
{
  "message": "Optional text to analyze",
  "imageUrl": "https://blob.vercel-storage.com/image.jpg",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Previous message",
      "timestamp": "2025-01-26T00:00:00.000Z"
    }
  ]
}
```

**Fields:**
- `message` (string, optional): Text to analyze
- `imageUrl` (string, optional): Blob URL of uploaded image
- `conversationHistory` (array, required): Previous messages in conversation

**Note:** Either `message` or `imageUrl` must be provided.

**Rate Limit:** 10 requests per minute per IP

**Caching:** Non-conversational requests (empty history) are cached for 5 minutes

### Response

**Success (200):**
```json
{
  "riskScore": 75,
  "credibilityScore": 30,
  "verdict": "High Risk",
  "reasoning": "Multiple red flags detected...",
  "redFlags": [
    "Urgent language",
    "Request for money",
    "Suspicious URL"
  ],
  "recommendations": [
    "Do not send money",
    "Verify sender identity",
    "Report to authorities"
  ],
  "detailedAnalysis": {
    "urgencyLevel": "high",
    "emotionalManipulation": true,
    "financialRequest": true
  }
}
```

**Error (400):**
```json
{
  "error": "Message or image required"
}
```

**Error (429):**
```json
{
  "error": "Too many requests, please try again later.",
  "retryAfter": 60
}
```

### Example

```javascript
// Text analysis
const response = await fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Urgent! Send money now!',
    conversationHistory: [],
  }),
});

// Image analysis
const response = await fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Is this legitimate?',
    imageUrl: 'https://blob.vercel-storage.com/screenshot.jpg',
    conversationHistory: [],
  }),
});
```

---

## 🔗 POST /api/url-inspector

Safely inspect a URL without visiting it.

### Request

**Content-Type:** `application/json`

**Body:**
```json
{
  "url": "https://suspicious-site.com"
}
```

**Rate Limit:** 20 requests per minute per IP

### Response

**Success (200):**
```json
{
  "url": "https://suspicious-site.com",
  "safe": false,
  "warnings": [
    "Domain recently registered",
    "No HTTPS certificate",
    "Suspicious TLD"
  ],
  "metadata": {
    "title": "Win Free iPhone!",
    "description": "Click here to claim...",
    "domain": "suspicious-site.com",
    "registrationDate": "2025-01-20"
  }
}
```

---

## 🧪 GET /api/test-gemini

Test Gemini AI connectivity (development only).

### Response

```json
{
  "status": "ok",
  "message": "Gemini AI is working correctly"
}
```

---

## 📊 Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| /api/upload | 5 requests | 1 minute |
| /api/analyze | 10 requests | 1 minute |
| /api/url-inspector | 20 requests | 1 minute |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1706227200000
Retry-After: 60
```

**Implementation:** Vercel KV (Redis) with sliding window

---

## 🗄️ Caching

**Endpoint:** `/api/analyze`

**Strategy:** 
- Only non-conversational requests (empty history)
- Cache key: SHA-256 hash of message + imageUrl
- TTL: 5 minutes (300 seconds)
- Storage: Vercel KV

**Cache Headers:**
```
X-Cache: HIT  // or MISS
```

---

## 🔒 Security

### Input Validation
- File type validation (upload)
- File size validation (upload)
- Text sanitization (analyze)
- URL validation (url-inspector)

### Rate Limiting
- IP-based throttling
- Vercel KV persistence
- Fail-open on KV errors

### Headers
- CSP (Content Security Policy)
- HSTS (HTTP Strict Transport Security)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY

---

## 🐛 Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (invalid input) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## 📝 Notes

### Image Handling
- Images are uploaded to Vercel Blob
- Blob URLs are used for analysis
- Images are fetched server-side and converted to base64 for Gemini AI
- No base64 data URLs in requests (deprecated)

### History Management
- Client-side only (localStorage)
- No server-side history API
- Privacy-focused approach

---

## 🔗 Related Documentation

- **SETUP_GUIDE.md** - Vercel Storage setup
- **DEPLOYMENT_CHECKLIST.md** - Deployment guide
- **.kiro/specs/vercel-blob-integration/** - Technical specification

---

**Last Updated:** 2025-01-26
**API Version:** 1.0.0
