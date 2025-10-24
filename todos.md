# Gemini Upgrade Plan

This document outlines the steps to upgrade the Gemini integration in the Scam Hunt Platform.

## 1. Core Model and Chat Enhancement

-   **File:** `src/lib/gemini-service.ts`
-   **Task:** Upgrade the core text model from `gemini-2.5-flash` to `gemini-2.5-pro`.
-   **Reasoning:** To leverage superior reasoning, instruction following, and coding capabilities for more accurate and less "robotic" analysis.

-   **File:** `src/lib/gemini-service.ts`
-   **Task:** Refine the `SYSTEM_PROMPT` to take advantage of the new model's improved instruction-following capabilities.
-   **Reasoning:** To elicit more nuanced and context-aware responses from the AI.

## 2. Implement Full Conversational Context (Chat History)

-   **File:** `src/hooks/useScamAnalysis.ts`
-   **Task:** Modify `sendViaRestAPI` to send the complete conversation history with each request.
-   **Reasoning:** To enable the model to maintain context, leading to more coherent and natural conversations.

-   **File:** `src/app/api/analyze/route.ts`
-   **Task:** Update the `handlePOST` function to receive and pass the full conversation history to the `analyzeScam` service.
-   **Reasoning:** To ensure the backend can handle stateful conversations.

-   **File:** `src/lib/gemini-service.ts`
-   **Task:** Adapt the `analyzeScam` function to accept and utilize the conversation history, creating a continuous dialogue with the model.
-   **Reasoning:** To transform the interaction from single-turn Q&A to a true conversational analysis.

## 3. Integrate Advanced Gemini Capabilities

### 3.1. Real-Time Web Intelligence

-   **File:** `src/lib/gemini-service.ts`
-   **Task:** Replace the mock `searchWeb` function with Gemini's "Grounding with Google Search" feature.
-   **Reasoning:** To enable real-time verification of URLs, entities, and claims against live web search results, significantly improving scam detection accuracy.

### 3.2. Advanced Image Analysis

-   **File:** `src/lib/gemini-service.ts`, `src/utils/uploadService.ts`
-   **Task:** Integrate the `gemini-2.5-flash-image` model for deep image analysis, including OCR and visual anomaly detection.
-   **Reasoning:** To go beyond simple image uploads and analyze screenshots, profile pictures, and other images for signs of manipulation or impersonation.

### 3.3. (Exploratory) UI Agent for Social Media Analysis

-   **File:** `src/lib/gemini-service.ts` (and potentially a new service file)
-   **Task:** Design and prototype a feature using the `gemini-2.5-computer-use` model to automate the analysis of social media profiles.
-   **Reasoning:** To explore the possibility of having an AI agent navigate and analyze social media profiles for a comprehensive risk assessment, as envisioned in the `GEMINI.md` document. This is a forward-looking, experimental feature.