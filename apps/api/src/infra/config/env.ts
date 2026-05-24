import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('*'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  PDF_UPLOAD_DIR: z.string().default('./uploads/pdf'),
  LOGO_URL: z.string().default(''),
  DATABASE_URL_TEST: z.string().url().optional(),
});

// Merge Bun.env and process.env to handle --env-file loading
const mergedEnv = { ...Bun.env, ...process.env };

export const env = envSchema.parse(mergedEnv);
