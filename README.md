# 🦁 Scam Hunt Platform - Digital Guardian

An AI-powered security platform designed to identify and neutralize online impersonation scams targeting supporters of Israel and the IDF. Built with cutting-edge technology and professional Lion Digital Guardian branding.

## 🛡️ Mission

Protecting supporters of Israel and the IDF from sophisticated online scams through advanced AI analysis, real-time threat detection, and comprehensive security assessment. Our platform serves as a digital guardian, standing watch against those who seek to exploit and deceive.

## 🏗️ Architecture

**Enterprise-Grade Serverless Stack:**

- **Frontend**: Next.js 16 with React 19 deployed on Vercel Edge Network
- **AI Engine**: Google Gemini 2.5 Pro for deep analysis + 2.5 Flash for conversational interface
- **Backend**: Complete AWS infrastructure (Lambda, API Gateway, DynamoDB, S3, CloudFront)
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
- **Persistent Storage**: AWS DynamoDB with graceful in-memory fallback
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

### Backend (AWS Infrastructure)
- **Compute**: AWS Lambda functions with Node.js 20 runtime
- **API Management**: AWS API Gateway with REST API and WebSocket support
- **Database**: AWS DynamoDB with on-demand scaling
- **File Storage**: AWS S3 with CloudFront integration
- **CDN**: AWS CloudFront for global content delivery
- **Monitoring**: AWS CloudWatch for logging and metrics

### AI Integration
- **AI Model**: Google Gemini 2.5 Pro via @google/genai SDK
- **Processing**: Server-side AI processing in Lambda functions
- **Streaming**: WebSocket connections for real-time AI responses
- **Security**: All API keys secured in AWS Lambda environment

### Quality Assurance
- **Testing**: Jest, React Testing Library, E2E testing
- **Code Quality**: ESLint v9, Prettier, Husky pre-commit hooks
- **Security**: Advanced input validation, rate limiting, CSP headers

## 📋 Prerequisites

- Node.js 18+ (recommended: 20+)
- pnpm (recommended) or npm
- Google Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))
- AWS Account (for production deployment)

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

# Optional (for AWS deployment)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
DYNAMODB_TABLE_NAME=scam-hunt-analyses
```

### 3. Development Server

```bash
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
│   │   ├── upload/          # Secure image upload
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
│   ├── ai/                  # AI integration modules
│   ├── storage/             # Storage providers (Memory/DynamoDB)
│   ├── security/            # Security and validation
│   └── exportUtils.ts       # Report generation utilities
├── types/                   # TypeScript definitions
└── utils/                   # Utility functions
```

## 🔧 API Endpoints

### Core Analysis
- `POST /api/analyze` - Comprehensive AI-powered scam analysis
  - **Input**: Text, images, URLs, conversation history
  - **Output**: Streaming response with structured JSON analysis
  - **Features**: Dual-score framework, risk detection, recommendations

### History Management
- `GET /api/history` - Retrieve user's analysis history
- `POST /api/history` - Save completed analysis
- `GET /api/history/[id]` - Get specific analysis details
- `POST /api/history/[id]/feedback` - Submit user feedback

### Security Utilities
- `POST /api/upload` - Secure image upload to AWS S3
- `POST /api/url-inspector` - Safe URL content analysis

## 🚀 Deployment Options

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/scam-hunt-platform)

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy to production
vercel --prod
```

### AWS Infrastructure

Complete AWS deployment using SAM or CDK:

```bash
# Deploy AWS backend
cd aws/
sam build
sam deploy --guided
```

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
- [Requirements Document](./.kiro/specs/scam-hunt-platform/requirements.md) - EARS-compliant requirements
- [Design Document](./.kiro/specs/scam-hunt-platform/design.md) - Architecture and component design
- [Implementation Tasks](./.kiro/specs/scam-hunt-platform/tasks.md) - Development roadmap

### Technical Guides
- [AWS Deployment Guide](./aws/README.md) - Infrastructure setup
- [Security Implementation](./docs/security.md) - Security best practices
- [API Documentation](./docs/api.md) - Endpoint specifications

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