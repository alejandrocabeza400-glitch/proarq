import { syncPayloadSchema } from '@proarq/core/application/ports/in/sync.input';
import { SyncUseCase } from '@proarq/core/application/use-cases/sync.use-case';
import { Router } from 'express';
import { syncHandler } from '../../driven/repositories/sync.handler';
import { syncController } from '../controllers/sync.controller';
import { decodeJWT } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const syncUseCase = new SyncUseCase(syncHandler);

export const router = Router();

router.post('/', decodeJWT, validate(syncPayloadSchema), syncController(syncUseCase));
