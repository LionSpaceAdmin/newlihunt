import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
process.env.GEMINI_API_KEY = 'test-api-key';
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
