import { z } from 'zod';

/**
 * Defines the schema for environment variables using Zod.
 * This ensures that all required environment variables are present and correctly typed.
 */
const envSchema = z.object({
  /**
   * The API key for the Google Gemini service.
   * This is required for the application to function.
   */
  GEMINI_API_KEY: z.string().min(1, {
    message: 'GEMINI_API_KEY is missing or empty. Please set it in your .env.local file.',
  }),

  /**
   * The environment the application is running in.
   * Defaults to 'development'.
   */
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

/**
 * Parses and validates the current environment variables against the schema.
 */
const parsedEnv = envSchema.safeParse(process.env);

// If validation fails, log the errors and stop the application.
if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables. Check your .env.local file.');
}

/**
 * The validated and typed environment variables.
 * Use this object throughout the application instead of `process.env`.
 */
export const env = parsedEnv.data;
