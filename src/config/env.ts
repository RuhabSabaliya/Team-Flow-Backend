import dotenv from 'dotenv';
import { z } from 'zod';

// Load variables from .env file into process.env
dotenv.config();

/**
 * Environment variables schema definition using Zod.
 * This guarantees at startup that required configuration is present and valid.
 * If an invalid or missing variable is detected, the application halts immediately with a clear error.
 */
const envSchema = z.object({
  PORT: z.coerce.number().default(2811),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  CORS_ORIGIN: z.string().default('http://localhost:2004'),

  // JWT Configuration
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters long'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters long'),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d')
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('CRITICAL: Environment variable validation failed:');
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = parsedEnv.data;
