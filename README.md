# 🦁 Scam Hunt Platform

An AI-powered platform for detecting online impersonation scams targeting supporters of Israel and the IDF. Built with Next.js 16 and Google Gemini 2.5 Pro/Flash.

## 🏗️ Architecture

**Modern Serverless Stack:**

- **Frontend**: Next.js 16 with React 19 on Vercel
- **AI Engine**: Google Gemini 2.5 Pro (analysis) + 2.5 Flash (chat)
- **Storage**: In-memory (development) / DynamoDB (production ready)
- **Deployment**: Vercel Edge Network

## 🚀 Features

- **🤖 AI-Powered Analysis**: Google Gemini 2.5 Pro for deep scam analysis
- **🔍 URL Inspection**: Safe URL analysis without visiting suspicious sites
- **📸 Multimodal Analysis**: Text + Image analysis for comprehensive scam detection
- **💬 Conversational Interface**: Chat-based interaction for natural analysis flow
- **📊 Analysis History**: Save and review past analyses with detailed reports
- **🎨 Modern UI**: Beautiful, responsive design with dark mode
- **🦁 Digital Guardian**: Lion-themed branding representing strength and protection
- **🌐 Multilingual**: Support for English and Hebrew

## 🛠️ Tech Stack

- **Frontend**: Next.js 16.0, React 19.2, TypeScript 5
- **Styling**: Tailwind CSS v4.1, Custom Design System
- **AI**: Google Gemini 2.5 Pro + 2.5 Flash (@google/genai)
- **Storage**: Memory Provider (dev) / DynamoDB Provider (prod-ready)
- **Testing**: Jest, React Testing Library
- **Code Quality**: ESLint v9, Prettier, Husky, lint-staged
- **Deployment**: Vercel Edge Network

## 📋 Prerequisites

- Node.js 18+ (recommended: 20+)
- npm or yarn
- Google Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))
- AWS Account (optional, for production storage)

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone <repository>
cd scam-hunt-platform
npm install
```

### 2. Environment Setup

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (Vercel Serverless Functions)
│   │   ├── analyze/       # AI analysis endpoint
│   │   ├── history/       # Analysis history CRUD
│   │   └── url-inspector/ # Safe URL inspection
│   ├── history/           # History pages
│   └── page.tsx           # Main application
├── components/            # React components
│   ├── Layout.tsx         # Main layout with dual-panel design
│   ├── ChatInterface.tsx  # Conversational UI
│   ├── ScamAnalysis.tsx   # Analysis results display
│   └── SupportWidget.tsx  # Donation/support widget
├── hooks/                 # Custom React hooks
│   └── useScamAnalysis.ts # Main analysis hook
├── lib/                   # Core services
│   ├── gemini-service.ts  # Gemini AI integration
│   ├── history-service.ts # Analysis history management
│   ├── middleware/        # Security & rate limiting
│   ├── security/          # Advanced security features
│   └── storage/           # Storage providers (Memory/DynamoDB)
├── types/                 # TypeScript definitions
└── utils/                 # Utility functions
```

## 🔧 API Endpoints

### Analysis
- `POST /api/analyze` - AI-powered scam analysis with multimodal support
  - Accepts: text, images, URLs
  - Returns: Comprehensive analysis with risk scores

### History
- `GET /api/history` - List all analysis history
- `POST /api/history` - Save new analysis
- `GET /api/history/[id]` - Get specific analysis
- `POST /api/history/[id]/feedback` - Submit feedback

### Utilities
- `POST /api/url-inspector` - Safe URL inspection without visiting

## 🚀 Deployment

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/LionSpaceAdmin/newlihunt)

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### Environment Variables

Required in Vercel dashboard or `.env.local`:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

Optional (for production storage):
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
DYNAMODB_TABLE_NAME=scam-hunt-analyses
```

## 📚 Documentation

- [Spec Documentation](./.kiro/specs/scam-hunt-platform/) - Complete project specifications
  - [Requirements](./.kiro/specs/scam-hunt-platform/requirements.md)
  - [Design](./.kiro/specs/scam-hunt-platform/design.md)
  - [Tasks](./.kiro/specs/scam-hunt-platform/tasks.md)
- [AWS Deployment](./aws/README.md) - AWS SAM deployment guide

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- src/components/__tests__/ChatInterface.test.tsx
```

### Test Coverage

- Unit tests for components and hooks
- Integration tests for API routes
- E2E tests for complete workflows
- Security and performance tests

## 🔒 Security Features

- **Input Sanitization**: Advanced validation for all user inputs
- **Rate Limiting**: Per-IP rate limiting on API endpoints
- **Security Headers**: CSP, HSTS, X-Frame-Options, etc.
- **Safe URL Inspection**: Analyze URLs without visiting them
- **User Privacy**: Anonymous user identification with hashing
- **Security Monitoring**: Event logging and monitoring system
- **XSS Protection**: DOMPurify for content sanitization

## 📈 Performance

- **Edge Network**: Vercel Edge Functions for global low-latency
- **Turbopack**: Next.js 16 with Turbopack for faster builds
- **Image Optimization**: Next.js Image component with WebP
- **Code Splitting**: Automatic route-based code splitting
- **Caching**: Smart caching strategies for API responses
- **Optimized AI**: Efficient prompts for Gemini 2.5 Pro/Flash

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Run linting (`npm run lint`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Quality

- ESLint configuration enforced
- Prettier for code formatting
- Husky pre-commit hooks
- TypeScript strict mode

## � Supporet the Project

This project is dedicated to protecting supporters of Israel and the IDF from online scams. 

**Support options:**
- 🇮🇱 [Support FIDF](https://www.fidf.org/donate) - Friends of the IDF
- 🎯 [Support This Project](https://buymeacoffee.com/danielhanukayeb/e/471429)
- ☕ [Buy Me a Coffee](https://www.buymeacoffee.com/danielhanukayeb)

## 📄 License

This project is private and proprietary.

---

**🦁 Join the pride. Roar for Israel. 🇮🇱🔥**

Built with ❤️ for the safety of Israel supporters worldwide.
