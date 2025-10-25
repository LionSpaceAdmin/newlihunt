# 🦁 Scam Hunt Platform - Digital Guardian

An AI-powered security platform designed to identify and neutralize online impersonation scams targeting supporters of Israel and the IDF. Built with cutting-edge technology and professional Lion Digital Guardian branding.

## 🛡️ Mission

Protecting supporters of Israel and the IDF from sophisticated online scams through advanced AI analysis, real-time threat detection, and comprehensive security assessment. Our platform serves as a digital guardian, standing watch against those who seek to exploit and deceive.

## 🏗️ Architecture

**Enterprise-Grade Serverless Stack:**

- **Frontend**: Next.js 16 with React 19 deployed on Vercel Edge Network
- **AI Engine**: Google Gemini 2.5 Pro for deep analysis + 2.5 Flash for conversational interface
- **Backend**: Vercel Serverless Functions with Vercel KV (Redis) for rate limiting and caching
- **Image Storage**: Vercel Blob for scalable image uploads with CDN delivery
- **User Data**: Client-side localStorage for user history and preferences
- **Security**: Multi-layer protection with rate limiting, input sanitization, and anonymous user identification
- **Graphics**: Professional Lion Digital Guardian visual identity system

## ✨ Key Features

### 🤖 **AI-Powered Analysis Engine**
- **Dual-Score Framework**: Risk Score (0-100) + Credibility Score (0-100)
- **Multimodal Detection**: Analyze text, images, and URLs simultaneously
- **Real-time Streaming**: Live analysis results with engaging visual feedback
- **False Positive Mitigation**: Advanced contextual analysis to minimize incorrect flags

### 🔍 **Comprehensive Threat Detection**
- **URL Inspection**: Safe analysis of suspicious links without visiting them
- **Image Analysis**: Detect manipulated images and fake screenshots
- **Behavioral Pattern Recognition**: Identify sophisticated impersonation tactics
- **Donation Scam Protection**: Specialized detection for fake charity requests

### 💬 **Conversational Security Interface**
- **Chat-Based Analysis**: Natural language interaction for threat assessment
- **Quick Action Buttons**: Streamlined analysis for common scam types
- **Visual Feedback**: Professional graphics and status indicators
- **Multilingual Support**: Full Hebrew and English localization

### 📊 **Analysis History & Reporting**
- **Client-Side Storage**: Browser localStorage for private, local history management
- **Detailed Reports**: Comprehensive analysis with reasoning and recommendations
- **Export Capabilities**: PDF, JSON, and social sharing options
- **Feedback System**: User rating system for continuous improvement

### 🎨 **Professional Visual Identity**
- **Lion Digital Guardian Branding**: Custom graphics throughout the platform
- **Matte Black Theme**: High-contrast design for accessibility
- **Responsive Design**: Optimized for desktop and mobile (320px-2560px)
- **Loading Animations**: Engaging lion-awakening graphics during processing

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 16.0 with React 19.2
- **Language**: TypeScript 5 with strict mode
- **Styling**: Tailwind CSS v4.1 with custom design system
- **Package Manager**: pnpm for efficient dependency management
- **Deployment**: Vercel with edge optimization and global CDN

### Backend
- **Serverless Functions**: Vercel Serverless Functions with Node.js 20 runtime
- **Rate Limiting**: Vercel KV (Redis) for persistent rate limit tracking
- **Caching**: Vercel KV for API response caching with TTL
- **Image Storage**: Vercel Blob for scalable file storage with CDN
- **Image Handling**: Upload to Vercel Blob, fetch for AI analysis
- **CDN**: Vercel Edge Network for global content delivery
- **Monitoring**: Vercel Analytics and logging

### AI Integration
- **AI Model**: Google Gemini 2.5 Pro via @google/genai SDK
- **Processing**: Server-side AI processing in Vercel Serverless Functions
- **Streaming**: Real-time streaming responses via HTTP
- **Security**: API keys secured in Vercel environment variables

### Quality Assurance
- **Testing**: Jest, React Testing Library, E2E testing
- **Code Quality**: ESLint v9, Prettier, Husky pre-commit hooks
- **Security**: Advanced input validation, rate limiting, CSP headers

## 📋 Prerequisites

- Node.js 18+ (recommended: 20+)
- npm or pnpm
- Google Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))
- Vercel Account (for production deployment)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository>
cd scam-hunt-platform
pnpm install
```

### 2. Environment Setup

```bash
cp .env.local.example .env.local
```

Configure your `.env.local`:

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional - Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Note: Vercel KV credentials are automatically configured when deployed to Vercel
# For local development with Vercel KV, add these from your Vercel dashboard:
# KV_REST_API_URL=your_kv_rest_api_url
# KV_REST_API_TOKEN=your_kv_rest_api_token
```

### 3. Development Server

```bash
npm run dev
# or
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the platform.

## 📁 Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── api/                 # Serverless API Routes
│   │   ├── analyze/         # AI analysis endpoint
│   │   ├── history/         # Analysis history management
│   │   ├── test-gemini/     # Gemini API test endpoint
│   │   └── url-inspector/   # Safe URL analysis
│   ├── history/             # Analysis history pages
│   ├── profile/             # User profile and statistics
│   └── layout.tsx           # Root layout with metadata
├── components/              # React Components
│   ├── Layout.tsx           # Main dual-panel layout
│   ├── ChatInterface.tsx    # Conversational analysis interface
│   ├── AnalysisPanel.tsx    # Results visualization
│   ├── StatusIcon.tsx       # Professional status graphics
│   ├── FlagCard.tsx         # Risk factor display
│   ├── OnboardingFlow.tsx   # User onboarding experience
│   └── SupportWidget.tsx    # Mission support integration
├── hooks/                   # Custom React Hooks
│   └── useScamAnalysis.ts   # Main analysis state management
├── lib/                     # Core Services
│   ├── middleware/          # Request middleware (rate limiting, security)
│   ├── security/            # Security and validation services
│   ├── storage/             # Storage type definitions
│   ├── config.ts            # Application configuration
│   ├── exportUtils.ts       # Report generation utilities
│   ├── feedback-service.ts  # User feedback handling
│   ├── gemini-service.ts    # Google Gemini AI integration
│   ├── history-service.ts   # Client-side history management (localStorage)
│   ├── social-media-tools.ts# Tools for social media analysis
│   └── user-identification.ts # User identification and tracking
├── types/                   # TypeScript definitions
└── utils/                   # Utility functions
```

## 🔧 API Endpoints

All endpoints run as Vercel Serverless Functions with automatic scaling and global edge deployment.

### Image Upload
- `POST /api/upload` - Upload images to Vercel Blob storage
  - **Input**: Multipart form data with image file
  - **Output**: JSON with Blob URL
  - **Validation**: JPEG, PNG, WebP only; max 10MB
  - **Rate Limiting**: 5 uploads per minute per IP via Vercel KV

### Core Analysis
- `POST /api/analyze` - Comprehensive AI-powered scam analysis
  - **Input**: Text, image URLs (Vercel Blob), URLs, conversation history
  - **Output**: Streaming response with structured JSON analysis
  - **Features**: Dual-score framework, risk detection, recommendations, Vercel KV caching
  - **Rate Limiting**: 10 requests per minute per IP via Vercel KV

### Security Utilities
- `POST /api/url-inspector` - Safe URL content analysis
  - **Rate Limiting**: 20 requests per minute per IP

### Development & Testing
- `GET /api/test-gemini` - Endpoint for testing Gemini API connectivity

**Note**: History management is handled client-side via localStorage for privacy and simplicity.

## 🚀 Deployment

### Production Deployment (Vercel)

**Live Site:** [https://lionsofzion.io](https://lionsofzion.io)  
**Vercel Deployment:** [https://newlihunt-40h6q2dax-lionsteam.vercel.app](https://newlihunt-40h6q2dax-lionsteam.vercel.app)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/scam-hunt-platform)

**Automatic Deployment:**
- Push to `main` branch triggers automatic deployment
- Vercel automatically configures environment variables
- `BLOB_READ_WRITE_TOKEN` is auto-configured for Vercel Blob
- `KV_*` variables are auto-configured for Vercel KV

**Manual Deployment:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
vercel --prod
```

**Required Environment Variables:**
- `GEMINI_API_KEY` - Set in Vercel dashboard under Settings > Environment Variables

**Optional Environment Variables:**
- `NEXT_PUBLIC_SITE_URL` - Defaults to https://lionsofzion.io

## 🧪 Testing & Quality

### Test Suite
```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage

# E2E tests
pnpm test:e2e
```

### Code Quality
```bash
# Linting
pnpm lint

# Type checking
pnpm type-check

# Format code
pnpm format
```

## 🔒 Security Features

### Multi-Layer Protection
- **Input Sanitization**: DOMPurify and custom validation
- **Rate Limiting**: IP-based and session-based throttling
- **Security Headers**: CSP, HSTS, X-Frame-Options
- **Anonymous Identification**: Privacy-preserving user tracking
- **Safe URL Analysis**: Inspect without visiting suspicious sites

### AWS Security
- **API Key Protection**: Secured in Lambda environment variables
- **Pre-signed URLs**: Secure S3 file uploads with expiration
- **Lambda Authorizers**: Custom authentication and authorization
- **CloudWatch Monitoring**: Security event logging and alerting

## 📈 Performance Optimizations

### Frontend
- **Edge Network**: Vercel global CDN deployment
- **Image Optimization**: Next.js Image component with WebP
- **Code Splitting**: Automatic route-based optimization
- **Lazy Loading**: Progressive component loading

### Backend
- **Streaming Responses**: Real-time AI analysis feedback
- **Connection Pooling**: Efficient AWS service connections
- **Caching Strategy**: Smart API response caching
- **Lambda Cold Start Optimization**: Minimal initialization time

## 🎨 Visual Design System

### Lion Digital Guardian Graphics
- **Brand Identity**: Consistent lion-themed visual elements
- **Status Icons**: Professional success/warning graphics
- **Loading States**: Engaging lion-awakening animations
- **Empty States**: Calm-guardian placeholder graphics
- **Background Patterns**: Subtle cyber-grid textures

### Design Principles
- **Accessibility**: High contrast, screen reader support
- **Responsiveness**: Fluid layouts across all devices
- **Professional Appearance**: Enterprise-grade visual hierarchy
- **Consistent Branding**: Unified Lion Digital Guardian identity

## 📚 Documentation

### Project Specifications
- [Vercel Blob Integration](./.kiro/specs/vercel-blob-integration/) - Current architecture specification
  - Requirements, design, and implementation tasks
  - Image upload and storage with Vercel Blob
  - Rate limiting and caching with Vercel KV

### Technical Guides
- [Vercel Deployment](https://vercel.com/docs) - Deployment documentation
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) - Image storage documentation
- [Vercel KV](https://vercel.com/docs/storage/vercel-kv) - Redis documentation

## 🤝 Contributing

We welcome contributions to strengthen our digital defense capabilities:

### Development Process
1. Fork the repository
2. Create feature branch (`git checkout -b feature/enhanced-detection`)
3. Implement changes with tests
4. Run quality checks (`pnpm lint && pnpm test`)
5. Submit pull request with detailed description

### Code Standards
- TypeScript strict mode compliance
- ESLint configuration adherence
- Comprehensive test coverage
- Security-first development practices

## 🎯 Support Our Mission

This platform is dedicated to protecting supporters of Israel and the IDF from online threats.

### Ways to Support
- **🇮🇱 [Support FIDF](https://www.fidf.org/donate)** - Friends of the IDF official donation
- **🎯 [Support This Project](https://buymeacoffee.com/danielhanukayeb/e/471429)** - Direct project support
- **⭐ Star this Repository** - Help others discover this security tool
- **🔄 Share with Community** - Spread awareness about online scam protection

### Mission Impact
- **Scam Detection**: Advanced AI-powered threat identification
- **Community Protection**: Safeguarding Israel supporters worldwide
- **Education**: Raising awareness about evolving scam tactics
- **Digital Defense**: Strengthening online security for vulnerable communities

## 📄 License

This project is proprietary and confidential. All rights reserved.

---

**🦁 Digital Guardian - Protecting the Pride**

*Built with dedication for the safety and security of Israel supporters worldwide. Together, we stand guard against digital deception and defend the truth online.*

**Am Yisrael Chai 🇮🇱**