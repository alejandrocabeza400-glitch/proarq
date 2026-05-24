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
  SWAGGER_ENABLED: z.preprocess(
    (v) => (v === undefined ? undefined : v === 'true' || v === '1'),
    z.boolean(),
  ).default(true),
});

// Merge Bun.env and process.env to handle --env-file loading
const mergedEnv = { ...Bun.env, ...process.env };

const _env = envSchema.parse(mergedEnv);

// Override SWAGGER_ENABLED with a dynamic getter that re-reads process.env on
// every access. This allows tests to toggle the flag at runtime without
// re-loading modules (the Zod parse above captures the static value once).
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
