# Scam Hunt Platform

An AI-powered platform for detecting online impersonation scams targeting supporters of Israel and the IDF.

## 🏗️ Architecture

**Hybrid Deployment:**
- **Frontend & AI**: Deployed on Vercel with Next.js API Routes
- **Backend Infrastructure**: AWS (DynamoDB, S3)

## 🚀 Features

- **AI-Powered Analysis**: Google Gemini 2.5 Pro for scam detection
- **URL Inspection**: Safe URL analysis without visiting suspicious sites
- **Image Analysis**: Screenshot analysis for social media scams
- **History Tracking**: Save and review past analyses
- **Real-time Chat**: Conversational interface for analysis

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **AI**: Google Gemini API (@google/genai)
- **Backend**: AWS DynamoDB, S3
- **Deployment**: Vercel (Frontend + API), AWS (Data)

## 📋 Prerequisites

- Node.js 18+
- Google Gemini API Key
- AWS Account (for data storage)

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
├── app/                 # Next.js App Router
│   ├── api/            # API Routes (Vercel Functions)
│   │   ├── analyze/    # AI analysis endpoint
│   │   ├── history/    # Analysis history
│   │   └── url-inspector/ # URL inspection
│   └── page.tsx        # Main application page
├── components/         # React components
├── hooks/             # Custom React hooks
├── lib/               # Utilities and services
│   ├── gemini-service.ts # Gemini AI integration
│   └── middleware/    # API middleware
└── types/             # TypeScript definitions
```

## 🔧 API Endpoints

- `POST /api/analyze` - AI-powered scam analysis
- `GET/POST /api/history` - Analysis history management
- `POST /api/url-inspector` - Safe URL inspection

## 🚀 Deployment

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables (Vercel)
- `GEMINI_API_KEY`: Your Google Gemini API key
- `ENVIRONMENT`: production

## 📚 Documentation

- [Deployment Guide](./README-DEPLOYMENT.md) - Detailed deployment instructions
- [AWS Setup](./AWS_DEPLOYMENT.md) - AWS infrastructure setup
- [Design Document](./design.md) - Architecture and design decisions

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 🔒 Security

- Input sanitization and validation
- Rate limiting on API endpoints
- Secure environment variable handling
- Safe URL inspection without direct access

## 📈 Performance

- Vercel Edge Functions for global distribution
- Optimized AI prompts for faster responses
- Efficient image processing
- Client-side caching

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is private and proprietary.
