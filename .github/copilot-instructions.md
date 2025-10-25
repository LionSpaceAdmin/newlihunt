# Copilot Instructions for Scam Hunt Platform

## Project Overview

- **Purpose**: AI-powered platform to detect and neutralize online impersonation scams, especially targeting Israel/IDF supporters.
- **Architecture**: Next.js 16 (React 19) frontend (Vercel Edge), AWS serverless backend (Lambda, API Gateway, DynamoDB, S3, CloudFront), Google Gemini AI integration.
- **Branding**: Lion Digital Guardian theme, high-contrast matte black, custom graphics.

## Key Patterns & Structure

- **Frontend**: `src/app/` (Next.js App Router), `src/components/` (UI), `src/hooks/` (state), `src/lib/` (services, middleware, security, storage), `src/types/`, `src/utils/`.
- **Backend**: AWS infra in `aws/` (see `aws/README.md`). Lambda functions for `/analyze`, `/history`, `/upload`, `/url-inspector`.
- **AI**: `src/lib/gemini-service.ts` (Gemini API), `src/app/api/analyze/route.ts` (main analysis endpoint).
- **Storage**: DynamoDB (prod), in-memory fallback (dev/test) via `src/lib/storage/`.
- **Security**: Rate limiting, input validation, CSP headers, anonymous user tracking. See `src/lib/middleware/` and `src/lib/security/`.

## Developer Workflows

- **Install**: `pnpm install` (pnpm preferred)
- **Dev server**: `pnpm dev` (Next.js, localhost:3000)
- **Test**: `pnpm test`, `pnpm test:watch`, `pnpm test:coverage`, `pnpm test:e2e`
- **Lint/Format**: `pnpm lint`, `pnpm format`, `pnpm type-check`
- **AWS Deploy**: `cd aws/ && make deploy ENV=dev` or use `sam build`/`sam deploy` (see `aws/README.md`)
- **Vercel Deploy**: `pnpm add -g vercel && vercel --prod`

## Conventions & Practices

- **TypeScript strict mode** throughout
- **Dual-score analysis**: Risk (0-100), Credibility (0-100)
- **Streaming API responses** for real-time feedback
- **Persistent history**: All analyses saved, retrievable by user
- **Feedback system**: User ratings for continuous improvement
- **Security-first**: All inputs sanitized, rate-limited, and logged
- **Anonymous user identification**: No PII stored
- **Custom visual identity**: Use provided lion-themed assets

## Integration Points

- **Google Gemini**: API key in `.env.local` as `GEMINI_API_KEY`
- **AWS**: Credentials in `.env.local` for backend deploys
- **API endpoints**: `/api/analyze`, `/api/history`, `/api/url-inspector`, `/api/test-gemini`, `/api/upload`
- **Frontend-backend**: All API calls via Next.js API routes or AWS endpoints

## Examples

- **Analysis flow**: User submits text/image/URL → `/api/analyze` → Gemini AI → dual-score + recommendations → results streamed to UI
- **History**: Analyses saved in DynamoDB, fetched via `/api/history` endpoints
- **Security**: All user input passes through `src/lib/middleware/` for validation and rate limiting

## References

- Main: `README.md` (project root)
- AWS: `aws/README.md`
- API: `src/app/api/`, `src/lib/gemini-service.ts`, `src/lib/history-service.ts`
- Security: `src/lib/middleware/`, `src/lib/security/`
- Storage: `src/lib/storage/`
- Visuals: `public/lion-digital-guardian/`

---

**For all AI agents:**

- Follow project-specific patterns above before defaulting to generic Next.js or AWS practices.
- When in doubt, reference the main `README.md` and `aws/README.md` for up-to-date workflows and architecture.
- Use strict TypeScript and security-first approaches by default.
