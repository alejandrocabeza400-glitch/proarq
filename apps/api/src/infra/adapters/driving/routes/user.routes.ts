import {
  createUserSchema,
  updateUserSchema,
} from '@proarq/core/application/ports/in/create-user.input';
import { CreateUserUseCase } from '@proarq/core/application/use-cases/create-user.use-case';
import { Router } from 'express';
import { postgresAuditRepo } from '../../driven/repositories/postgres-audit.repository';
import { postgresUserRepo } from '../../driven/repositories/postgres-user.repository';
import {
  createUserController,
  deleteUserController,
  exportPdfUsersController,
  getUserController,
  listUsersController,
  updateUserController,
} from '../controllers/user.controller';
import { checkRole, decodeJWT } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

// Composition Root: wire use case → repository & audit logging
const createUser = new CreateUserUseCase(postgresUserRepo, postgresAuditRepo);

export const router = Router();

router.post(
  '/',
  decodeJWT,
  checkRole('ADMIN'),
  validate(createUserSchema),
  createUserController(createUser),
);

router.get('/pdf', decodeJWT, checkRole('ADMIN'), exportPdfUsersController(createUser));

router.get('/', decodeJWT, checkRole('ADMIN'), listUsersController(createUser));

router.get('/:id', decodeJWT, checkRole('ADMIN'), getUserController(createUser));

router.put(
  '/:id',
  decodeJWT,
  checkRole('ADMIN'),
  validate(updateUserSchema),
  updateUserController(createUser),
);

router.delete('/:id', decodeJWT, checkRole('ADMIN'), deleteUserController(createUser));
