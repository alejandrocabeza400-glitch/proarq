import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('*'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters')
    .default('proarq-super-secret-refresh-key-that-is-at-least-32-chars-long!!'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  PDF_UPLOAD_DIR: z.string().default('./uploads/pdf'),
  LOGO_URL: z.string().default(''),
  DATABASE_URL_TEST: z.string().url().optional(),
  SWAGGER_ENABLED: z
    .preprocess((v) => (v === undefined ? undefined : v === 'true' || v === '1'), z.boolean())
    .default(true),
});

const mergedEnv = { ...Bun.env, ...process.env };

const _env = envSchema.parse(mergedEnv);

Object.defineProperty(_env, 'SWAGGER_ENABLED', {
  get() {
    const val = process.env.SWAGGER_ENABLED;
    if (val === undefined) return true;
    return val === 'true' || val === '1';
  },
  enumerable: true,
  configurable: true,
});

export const env = _env;
