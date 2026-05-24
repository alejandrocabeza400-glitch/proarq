import { type NextFunction, type Request, type Response, Router } from 'express';
import { env } from '../../../config/env';
import { swaggerServe, swaggerSetupHandler, swaggerSpec } from '../swagger/swagger-ui';
import { router as apuRouter } from './apu.routes';
import { router as auditRouter } from './audit.routes';
import { router as authRouter } from './auth.routes';
import { router as cotizacionRouter } from './cotizacion.routes';
import { router as healthRouter } from './health.routes';
import { router as insumoRouter } from './insumo.routes';
import { router as proyectoRouter } from './proyecto.routes';
import { router as syncRouter } from './sync.routes';
import { router as userRouter } from './user.routes';

// ---------------------------------------------------------------------------
// Factory: create a fresh router
// ---------------------------------------------------------------------------
export function createRouter(): Router {
  const router = Router();
  const api = Router();

  // ---- API routes ----
  api.use('/health', healthRouter);
  api.use('/auth', authRouter);
  api.use('/users', userRouter);
  api.use('/insumos', insumoRouter);
  api.use('/apus', apuRouter);
  api.use('/cotizaciones', cotizacionRouter);
  api.use('/audit-logs', auditRouter);
  api.use('/sincronizar', syncRouter);
  api.use('/proyectos', proyectoRouter);

  router.use('/api/v1', api);

  // ---- Raw OpenAPI spec - runtime check ----
  router.get('/api/v1/docs.json', (_req: Request, res: Response, next: NextFunction) => {
    if (!env.SWAGGER_ENABLED) {
      return next('route');
    }
    res.json(swaggerSpec);
  });

  // ---- Swagger UI at root path / - runtime check ----
  router.use('/', (req: Request, res: Response, next: NextFunction) => {
    if (!env.SWAGGER_ENABLED) {
      return next('route');
    }

    let idx = 0;
    const run = (err?: unknown) => {
      if (err) return next(err);
      if (idx < swaggerServe.length) {
        swaggerServe[idx++](req, res, run as NextFunction);
      } else {
        swaggerSetupHandler(req, res, next);
      }
    };
    run();
  });

  return router;
}

// ---- Singleton router for normal use ----
export const router = createRouter();
