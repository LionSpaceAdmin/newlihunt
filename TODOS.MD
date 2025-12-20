# TODO – LionsOfZion.io (Scam Hunter) Site Debugging Report

This document summarizes the issues identified during a thorough review of **lionsofzion.io** (Scam Hunter).  Each issue is described with context, symptoms, and supporting evidence gathered from the site.  Addressing these items should improve functionality, user experience and reliability.

## 1. Core Analysis Chat Bugs

- **Analysis results panel never updates.**  When a user submits content for analysis, the left chat panel displays the AI’s JSON‑like response, but the **Analysis Results** section on the right remains stuck at *“Waiting for analysis… / Ready for Analysis.”*  Consequently, the risk/credibility scores promised by the UI are never shown in the dedicated panel【895844026139166†screenshot】.
- **Raw JSON output returned to user.**  Responses from the AI are delivered as unformatted JSON strings with triple backticks and large “reasoning” sections【56121233703485†screenshot】.  This is confusing for non‑technical users and contradicts the UI’s promise of a clean dual‑score display.  The JSON should be parsed client‑side and rendered into the results panel rather than displayed in the chat.
- **Quick actions insert prompts incorrectly.**  Selecting a quick action (e.g., *Analyze Social Media Post*, *Check Suspicious Email*, etc.) inserts a template prompt into the input field but **does not separate** the template from the user’s input.  User text becomes concatenated with the placeholder, resulting in incoherent queries (e.g., `Analyze this social media post: [paste link or description]Check this tweet…`)【3808130542828†screenshot】.  The placeholder should disappear once the user starts typing.
- **HTTP 500 errors for most quick actions.**  Submitting queries via quick actions (*Analyze Social Media Post*, *Check Suspicious Email*, *Verify Donation Request* and *Analyze X Profile*) consistently triggers an **HTTP 500** error with a red notification and a retry button【840518276103178†screenshot】【760817436405412†screenshot】.  These actions fail to reach the backend.
- **Inspect Website quick action unusable.**  The *Inspect Website* option asks “Is this website trustworthy? [paste URL]” but the input field does not accept text.  Pressing **Enter** opens a file picker instead of sending the message (the upload button receives focus).  Users cannot type a URL or send the request.  In earlier tests, a message was accepted only once, returning JSON similar to other analyses; replicating this behaviour became impossible due to the focus bug.
- **Search the Web action not implemented.**  Choosing *Search the Web* yields a response where the AI says it cannot perform general web searches and instructs the user to provide content for analysis【157463088298894†screenshot】.  The quick action is misleading and does not perform a search.
- **Chat becomes unresponsive after some actions.**  After the AI asks the user to replace a placeholder (e.g., `[paste URL]`), the input field can lose focus permanently.  Further attempts to type or send a message either do nothing or trigger the file‑upload dialog.  Clearing the chat resets the view but sometimes retains the faulty placeholder.
- **Clear Chat does not reset results panel.**  Clicking *Clear Chat* removes previous messages but leaves the **Analysis Results** panel stuck at “Waiting for analysis…”; it doesn’t reset to an empty state or update after new analyses.

## 2. Data Persistence & Profile/History Pages

- **Analysis history is never saved.**  Even after performing multiple analyses, the **History** page states “No Analysis History” and prompts the user to start a new analysis【699321435300875†screenshot】.  According to the privacy policy, analysis results should be stored in localStorage【5400190688640†L27-L37】, but this functionality appears broken.
- **Profile statistics do not update.**  The **Profile** page displays “Analysis Statistics” (number of analyses, average risk score, average credibility score, etc.), yet all counters remain zero and **Recent Activity** is empty【124105797335376†screenshot】.  This indicates that local history is neither written nor read.
- **Settings actions ineffective.**  Buttons such as “View Full History,” “New Analysis,” and “Clear All History” on the Profile page do not change the state (history remains empty).  Clearing history has no visible effect because nothing is stored.

## 3. User Interface & Experience Issues

- **Onboarding tour appears on every visit.**  The five‑step introduction modal pops up each time the analysis page is loaded, even after the user has previously dismissed it.  The site should store a flag in localStorage to avoid repeatedly showing the tutorial.
- **Language and internationalisation**: The site mixes English and Hebrew (e.g., part of the AI’s response includes Hebrew reasoning【56121233703485†screenshot】).  There is no language toggle, and some texts may be confusing for users who are not bilingual.
- **Accessibility & focus management:** After certain quick actions, keyboard focus unexpectedly jumps to the hidden file‑upload element.  This triggers the OS file picker when the user presses Enter, which can be frustrating and confusing.  Proper aria labels and focus control should be implemented.
- **Error messages lack detail.**  The red “HTTP 500” alert provides no explanation or steps for resolution.  Including more descriptive error messages (e.g., “Server error—please try again later or check your network connection”) would improve transparency.
- **Donation links lead away from the site.**  Links like **Support FIDF** and **Buy Me Coffee** open external donation pages【470647765118761†screenshot】【323328013424097†screenshot】.  While not inherently problematic, there is no warning that the user is leaving the site, and the pages open without opening a new tab, potentially disrupting the session.
- **Quick links to legal pages not obvious.**  The **Contact**, **Privacy Policy** and **Terms of Service** pages exist and contain detailed content【561368237297717†L14-L30】【5400190688640†L14-L31】【828341930681724†L14-L29】, but the links at the bottom of the home page are small and easy to miss.  They could be more prominent or included in the main navigation.
- **Broken/hard‑coded image placeholders.**  Several parts of the home page show blank or misaligned icons (e.g., the hero section initially displays an empty square).  Ensure images load correctly and have alt text.

## 4. Functional & Backend Considerations

- **API integration reliability:**  The site relies on Google Gemini AI through a serverless function.  Frequent HTTP 500 responses suggest backend failures or rate limiting.  Logging and graceful error handling should be added to diagnose server issues and to provide user feedback.
- **LocalStorage usage does not match policy.**  The Privacy Policy states that all analysis results and history are stored locally【5400190688640†L27-L37】, but no such data is observed (history remains empty).  Confirm that writes to localStorage occur and that they are read back correctly on the history and profile pages.
- **Security considerations:**  The Terms of Service emphasises rate limiting and input sanitisation【5400190688640†L81-L83】, yet the platform crashed on simple text input.  Review backend validation to prevent crashes from unexpected input and ensure sanitisation is correctly implemented.

## 5. Suggested Fixes & Enhancements

1. **Fix result rendering:**  Parse the AI’s JSON response client‑side and populate the **Analysis Results** panel with the risk and credibility scores, classification (e.g., SAFE, SUSPICIOUS, SCAM), and a concise summary.  Hide the raw JSON from the chat or show it in an expandable advanced view.
2. **Stabilise quick actions:**  Investigate and fix the backend endpoints for social media posts, emails, donation requests and X profiles to eliminate HTTP 500 errors.  Ensure each quick action sends the correct payload and that the server returns a structured response.
3. **Improve input handling:**  Remove static prompt text once the input field gains focus.  Ensure the send button and Enter key submit the message rather than opening the file picker.  When the user fails to replace a placeholder, display a helpful validation message rather than freezing the input.
4. **Persist analysis history:**  Implement storing analyses in localStorage (or another client‑side storage) and reading it back to display on the **History** and **Profile** pages.  Include functions to clear individual entries or all history.
5. **Update onboarding logic:**  Save a flag when the user completes the introduction so that the modal does not appear on subsequent visits.
6. **Enhance error handling:**  Display user‑friendly error messages when backend errors occur.  Provide retry options and fallbacks rather than raw server codes.
7. **Accessibility improvements:**  Add proper focus management, keyboard navigation support and aria labels.  Ensure that file upload triggers only when the user intentionally selects the upload icon.
8. **Highlight legal & support links:**  Make the contact, privacy policy and terms pages more visible.  Consider adding them to the main navigation or a footer bar.
9. **Test across browsers & devices:**  Conduct cross‑browser testing to identify any CSS or JavaScript issues that may cause misalignment or unresponsive inputs on certain screens.
10. **Add analytics & logging:**  Implement client‑side and server‑side logging to detect crashes, HTTP errors and user journey drop‑offs.  Use this data to prioritise bug fixes and measure improvements.

---

By resolving these issues, the **Scam Hunter** platform can deliver on its promise of AI‑powered protection and provide a smoother, more reliable experience for users seeking to combat online scams.
