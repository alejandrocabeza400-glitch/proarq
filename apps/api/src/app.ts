import cors from 'cors';
import type { Express } from 'express';
import express from 'express';
import { errorHandler } from './infra/adapters/driving/middleware/error-handler.middleware';
import { createRouter } from './infra/adapters/driving/routes';
import { env } from './infra/config/env';

// ---------------------------------------------------------------------------
// Factory: create a fresh Express app instance
// ---------------------------------------------------------------------------
export function createApp(): Express {
  const app = express();

  app.use(express.json());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
    }),
  );
  app.use(createRouter());
  app.use(errorHandler);

  return app;
}

// ---- Singleton: instantiated once at module load ----
export const app = createApp();
