# GEMINI.md

## Project Overview

This project is the **Scam Hunt Platform**, an AI-powered security tool designed to identify and neutralize online impersonation scams. It provides real-time analysis of suspicious content (text and images) through a conversational interface powered by Google Gemini.

The platform is built as a modern web application with a clear separation of concerns:

*   **Frontend:** A Next.js (React) application written in TypeScript and styled with Tailwind CSS. It's deployed on Vercel for optimal performance.
*   **Backend:** A serverless architecture on AWS, using Lambda functions for business logic, API Gateway for routing, DynamoDB for data storage, and S3 for file uploads.

## Building and Running

### Prerequisites

*   Node.js
*   npm (or pnpm/yarn)

### Key Commands

*   **Install dependencies:**
    ```bash
    npm install
    ```
*   **Run the development server:**
    ```bash
    npm run dev
    ```
*   **Build the project for production:**
    ```bash
    npm run build
    ```
*   **Run the production server:**
    ```bash
    npm run start
    ```
*   **Run tests:**
    ```bash
    npm test
    ```
*   **Run tests in watch mode:**
    ```bash
    npm run test:watch
    ```
*   **Run tests with coverage:**
    ```bash
    npm run test:coverage
    ```
*   **Run linters and type checker:**
    ```bash
    npm run quality
    ```

## Development Conventions

*   **Language:** TypeScript is used for all frontend and backend code.
*   **Styling:** Tailwind CSS is used for styling, with a custom matte black theme.
*   **Code Quality:** ESLint and Prettier are used for linting and formatting. A pre-commit hook runs these checks automatically.
*   **Testing:** Jest is used for unit and integration testing. Tests are located in `__tests__` directories alongside the code they are testing.
*   **Architecture:** The frontend is component-based, with a clear separation between pages, components, hooks, and utility functions. The backend is serverless, with individual Lambda functions for each API endpoint.
*   **AI Integration:** The AI logic is encapsulated in the `src/lib/gemini-service.ts` file, which communicates with the Google Gemini API.

## Future Capabilities

Based on the latest Gemini API updates, here are some potential enhancements for the Scam Hunt Platform:

### 1. Enhanced Web Intelligence

*   **Real-time Verification:** Integrate Gemini's "Grounding with Google Search" feature to cross-reference suspicious claims, URLs, and entities with live web search results. This would allow the platform to:
    *   Verify the legitimacy of organizations and donation platforms.
    *   Check for news articles or reports about known scams.
    *   Identify if a website is newly created or has a bad reputation.

### 2. Advanced Social Media Analysis

*   **Deep Profile Analysis:** Go beyond just analyzing a profile picture. By leveraging Gemini's advanced capabilities, the platform could:
    *   **Analyze a user's posts:** Perform sentiment analysis on a user's timeline to detect emotional manipulation, urgent language, or other scam tactics.
    *   **Examine a user's network:** Analyze a user's followers and followed accounts to identify bot-like behavior or connections to known scam networks.
    *   **Automated Profile Navigation:** Use a Gemini-powered agent to navigate a social media profile like a human would, gathering information from the bio, posts, and comments to build a more comprehensive risk assessment.