# Scam Hunt Platform - TODOS

This checklist outlines the necessary improvements and bug fixes for the Scam Hunt Platform.

## P0: Critical Bugs & Core Functionality

- [x] **Correct Quick Action Prompts:** Update `ChatInterface.tsx` to use specific, instructional prompts for each quick action button.
- [x] **Rework Image Handling (Remove S3 Dependency):**
  - [x] Modify `ChatInterface.tsx` to convert uploaded images to base64 data URLs.
  - [x] Modify `useScamAnalysis.ts` to send the base64 data URL to the `/api/analyze` endpoint.
  - [x] Update `/api/analyze/route.ts` to accept and process the base64 data URL.
  - [x] Remove `src/utils/uploadService.ts` and `/api/upload/route.ts`.
  - [x] Remove AWS S3 SDK dependencies from `package.json`.
- [x] **Consolidate and Fix Security Headers (CSP):**
  - [x] Designate `next.config.ts` as the single source of truth for all security headers.
  - [x] Merge and update CSP directives from all sources into `next.config.ts`.
  - [x] Remove CSP definitions from `src/proxy.ts` and `vercel.json`.
  - [x] Remove `src/proxy.ts`.
- [x] **Implement Persistent Rate Limiting for Vercel:** Replace the in-memory rate limiter in `rate-limiter.ts` with a persistent store like Vercel KV.
- [x] **Address Non-Functional UI Elements:**
  - [x] Connect the "Learn More" button in `LandingPage.tsx`.
  - [x] Link the gear icon in `Navigation.tsx` to the `/profile` page.
  - [x] Ensure the support icon in `SupportWidget.tsx` works.
  - [x] Verify "Buy Me a Coffee" links work after CSP fixes.

## P1: Core AI & Functionality Enhancements

- [x] **Implement Enforced JSON Schema for AI Output:** Use Gemini's forced JSON output mode in `gemini-service.ts` to ensure reliable JSON output.
- [x] **Gracefully Handle Mock AI Tools:** In `gemini-service.ts`, handle calls to mock tools by returning a structured "unavailable" response.
- [x] **Align Analysis Panel with AI Output Schema:** Ensure `AnalysisPanel.tsx` correctly parses and displays the JSON output from the AI.
- [x] **Upgrade URL Inspector with Google Search:** Use Gemini's Google Search grounding in `/api/url-inspector/route.ts` for more detailed URL analysis.
- [x] **Implement Analysis Caching with Vercel KV:** Cache analysis results in Vercel KV to reduce API calls and latency.
- [x] **Implement AI Safety Settings:** Adjust Gemini's `safetySettings` in `gemini-service.ts` to be more permissive for incoming content.
- [x] **Implement Client-Side User Feedback:** Add thumbs up/down buttons to `AnalysisPanel.tsx` and connect them to `feedback-service.ts`.
- [x] **Integrate Report Export/Sharing (Client-Side):** Add export/sharing buttons to `AnalysisPanel.tsx` and `[reportId]/page.tsx` and connect them to `exportUtils.ts`.
- [x] **Implement Client-Side History Storage:** Ensure `history-service.ts` uses `LocalHistoryService` and that history pages load data from it.

## P2: UX & Feature Improvements

- [x] **Enhance History Page UI & Functionality:** Implement client-side pagination, search, filtering, and sorting for the history page.
- [x] **Replace Browser `confirm()` with Modal:** Use a custom modal for delete confirmations in the history report page.
- [x] **Complete Profile/Settings Page:** Make the profile page functional with links and basic stats.
- [x] **Add Contact & Legal Pages:** Create `/contact`, `/privacy`, and `/terms` pages with a site footer.
- [x] **Refine Onboarding Flow:** Test the onboarding flow and add a link to the privacy policy.
- [x] **Review and Remove WebSocket Logic:** Remove all WebSocket-related code from the frontend.

## P3: Polish & Maintenance

- [x] **Full Graphics Integration:** Replace all placeholder emojis with the "Lion Digital Guardian" branding.
  - **Note:** Current graphics limited to specific assets (app-icon, background-pattern, empty-state, hero-banner, loading-screen, report-card, social-card, status-success, status-warning). No suitable replacements available for flag/coffee emojis. Deferred until additional brand assets are created.
- [x] **Conduct Accessibility Audit (A11y):** Use tools and manual testing to ensure the app meets WCAG AA standards.
  - **Completed:** Added aria-labels to select elements, fixed Tailwind classes, verified all images have alt text.
- [ ] **Conduct Performance Audit:** Use Lighthouse and Bundle Analyzer to optimize performance.
- [ ] **Add AI Limitations Transparency:** Add a disclaimer about AI limitations in the UI.
- [ ] **Update Dependencies:** Regularly update project dependencies.
- [ ] **Enhance Local Testing Suite:** Add unit tests for critical client-side functions and API routes.
- [ ] **Remove Unused AWS Code/Config:** Delete the `aws/` directory and related dependencies.
