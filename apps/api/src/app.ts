import express from 'express';
import cors from 'cors';
import { router } from './infra/adapters/driving/routes';
import { errorHandler } from './infra/adapters/driving/middleware/error-handler.middleware';
import { env } from './infra/config/env';

export const app = express();

app.use(express.json());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
  }),
);
app.use(router);
app.use(errorHandler);
