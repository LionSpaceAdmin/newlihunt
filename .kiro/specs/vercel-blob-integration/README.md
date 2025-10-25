# Vercel Blob Integration Specification

## 📋 Overview

This specification defines the integration of **Vercel Blob storage** for image uploads in the Scam Hunt Platform, replacing the previous base64 data URL approach with a dedicated, scalable file storage solution.

## 🎯 Purpose

**Why this change?**

The platform previously used base64 encoding for images, which was implemented during AWS infrastructure removal. However, with a Vercel Blob store (`lionscamhunt-blob`) now provisioned, we're adopting a more scalable and performant approach:

- ✅ **Better Performance**: Smaller request payloads, CDN delivery
- ✅ **Scalability**: Handle larger images efficiently
- ✅ **Caching**: More efficient with URL-based keys
- ✅ **Sharing**: Images can be referenced by URL
- ✅ **CDN Benefits**: Global edge delivery via Vercel

## 📚 Documentation Structure

### Core Documents

1. **[requirements.md](./requirements.md)** - EARS-compliant requirements
   - 9 main requirements covering all aspects of Vercel Blob integration
   - Acceptance criteria for each requirement
   - Supersedes Requirement 4 from architecture-consolidation spec

2. **[design.md](./design.md)** - Technical design and architecture
   - High-level architecture diagrams
   - Data flow documentation
   - Component interfaces and implementations
   - Error handling strategies
   - Security considerations
   - Migration strategy for legacy data

3. **[tasks.md](./tasks.md)** - Implementation checklist
   - 9 main tasks with sub-tasks
   - Each task references specific requirements
   - Clear, actionable implementation steps
   - Testing and verification tasks

### Supporting Documents

4. **[SUMMARY.md](./SUMMARY.md)** - Quick overview
   - Why this change?
   - Architecture comparison (before/after)
   - Key components
   - Implementation status
   - Migration notes

5. **[CODE_CHANGES.md](./CODE_CHANGES.md)** - Developer guide
   - Exact code changes required
   - New files to create
   - Files to modify
   - Files to clean up
   - Search and replace patterns
   - Testing checklist

## 🚀 Quick Start

### For Reviewers

1. Read [SUMMARY.md](./SUMMARY.md) for high-level overview
2. Review [requirements.md](./requirements.md) for acceptance criteria
3. Check [design.md](./design.md) for technical approach

### For Implementers

1. Read [CODE_CHANGES.md](./CODE_CHANGES.md) for exact changes
2. Follow [tasks.md](./tasks.md) step-by-step
3. Reference [design.md](./design.md) for implementation details

## 🏗️ Architecture Changes

### Before (Base64)
```
User → Select Image → Convert to Base64 → Send to /api/analyze → AI Analysis
```

### After (Vercel Blob)
```
User → Select Image → Upload to /api/upload → Get Blob URL → 
Send URL to /api/analyze → Fetch Image → AI Analysis
```

## 📦 Key Components

### 1. Upload Endpoint
- **Path**: `/api/upload`
- **Method**: POST
- **Input**: Multipart form data
- **Output**: Blob URL
- **Rate Limit**: 5 uploads/minute

### 2. Analysis Endpoint (Updated)
- **Path**: `/api/analyze`
- **Change**: Accepts `imageUrl` instead of `imageBase64DataUrl`
- **Behavior**: Fetches image from Blob URL before analysis

### 3. Frontend (Updated)
- **ChatInterface.tsx**: Upload file to `/api/upload`
- **useScamAnalysis.ts**: Send Blob URL to analysis
- **Remove**: Base64 conversion logic

### 4. History Service (Updated)
- **Storage**: Blob URLs instead of base64
- **Backward Compatibility**: Graceful fallback for legacy entries

## 🔗 Related Specifications

### Architecture Consolidation
- **Location**: `.kiro/specs/architecture-consolidation/`
- **Relationship**: This spec supersedes Requirement 4 (Image Handling)
- **Status**: Updated to reference this spec

### Maintained from Architecture Consolidation
- ✅ Vercel KV for rate limiting and caching
- ✅ localStorage for client-side history
- ✅ No AWS infrastructure

## 🌍 Environment Variables

### Production Deployment
- **Domain**: https://lionsofzion.io
- **Vercel App**: https://newlihunt-40h6q2dax-lionsteam.vercel.app

### Automatic Configuration (Production)
```bash
BLOB_READ_WRITE_TOKEN  # Auto-configured by Vercel
KV_REST_API_URL        # Auto-configured by Vercel
KV_REST_API_TOKEN      # Auto-configured by Vercel
```

### Manual Configuration (Local Development)
```bash
GEMINI_API_KEY=your_gemini_api_key_here
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx  # Get from Vercel dashboard
KV_REST_API_URL=your_kv_url                 # Get from Vercel dashboard
KV_REST_API_TOKEN=your_kv_token             # Get from Vercel dashboard
```

## ✅ Implementation Checklist

- [ ] Review and approve specification
- [ ] Install @vercel/blob package
- [ ] Create /api/upload endpoint
- [ ] Update /api/analyze endpoint
- [ ] Update frontend upload logic
- [ ] Update history service
- [ ] Remove base64 code
- [ ] Update documentation
- [ ] Run quality checks
- [ ] Test functionality
- [ ] Deploy to production

See [tasks.md](./tasks.md) for detailed breakdown.

## 🧪 Testing Strategy

### Unit Tests
- Upload endpoint validation
- File type and size checks
- Error handling

### Integration Tests
- End-to-end upload flow
- Image analysis with Blob URLs
- History with Blob URLs
- Rate limiting

### Manual Tests
- Upload various image types
- Test file validation
- Verify rate limiting
- Check error scenarios

## 📊 Migration Notes

### Legacy Data Handling
- **Old entries**: Base64 images in localStorage
- **New entries**: Blob URLs
- **Strategy**: Graceful fallback (display both formats)
- **No migration required**: Old data continues to work

## 🔒 Security Considerations

- ✅ Rate limiting on uploads (5/minute)
- ✅ File type validation (JPEG, PNG, WebP only)
- ✅ File size validation (max 10MB)
- ✅ Public access (images are not sensitive)
- ✅ Random suffixes prevent URL guessing
- ✅ HTTPS only

## 📈 Performance Benefits

| Aspect | Base64 | Vercel Blob |
|--------|--------|-------------|
| Request Size | Large (+33%) | Small (URL only) |
| Caching | Inefficient | Efficient |
| CDN | No | Yes |
| Scalability | Limited | High |
| Image Sharing | No | Yes |

## 🤝 Contributing

When implementing this specification:

1. Follow the task order in [tasks.md](./tasks.md)
2. Reference [CODE_CHANGES.md](./CODE_CHANGES.md) for exact changes
3. Run quality checks after each major change
4. Update this spec if you discover issues or improvements

## 📞 Support

For questions or clarifications:

1. Review [design.md](./design.md) for technical details
2. Check [CODE_CHANGES.md](./CODE_CHANGES.md) for implementation guidance
3. Refer to [Vercel Blob documentation](https://vercel.com/docs/storage/vercel-blob)

## 📝 Status

- **Created**: 2025-01-26
- **Status**: Ready for Implementation
- **Supersedes**: Architecture Consolidation Requirement 4
- **Dependencies**: @vercel/blob package, Vercel Blob store provisioned

---

**Ready to implement?** Start with [tasks.md](./tasks.md) and [CODE_CHANGES.md](./CODE_CHANGES.md)!
