import { Router } from 'express';
import { decodeJWT } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { SyncUseCase } from '@proarq/core/application/use-cases/sync.use-case';
import { syncPayloadSchema } from '@proarq/core/application/ports/in/sync.input';
import { syncController } from '../controllers/sync.controller';
import { syncHandler } from '../../driven/repositories/sync.handler';

const syncUseCase = new SyncUseCase(syncHandler);

export const router = Router();

router.post(
  '/',
  decodeJWT,
  validate(syncPayloadSchema),
  syncController(syncUseCase),
);
