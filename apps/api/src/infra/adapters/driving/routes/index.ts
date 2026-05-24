import { Router } from 'express';
import { router as healthRouter } from './health.routes';
import { router as userRouter } from './user.routes';
import { router as authRouter } from './auth.routes';
import { router as insumoRouter } from './insumo.routes';
import { router as apuRouter } from './apu.routes';
import { router as cotizacionRouter } from './cotizacion.routes';
import { router as auditRouter } from './audit.routes';
import { router as syncRouter } from './sync.routes';

const router = Router();
const api = Router();

api.use('/health', healthRouter);
api.use('/auth', authRouter);
api.use('/users', userRouter);
api.use('/insumos', insumoRouter);
api.use('/apus', apuRouter);
api.use('/cotizaciones', cotizacionRouter);
api.use('/audit-logs', auditRouter);
api.use('/sincronizar', syncRouter);

router.use('/api/v1', api);

export { router };
