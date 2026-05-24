import { Router } from 'express';
import {
  createUserController,
  listUsersController,
  getUserController,
  updateUserController,
  deleteUserController,
} from '../controllers/user.controller';
import { decodeJWT, checkRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { CreateUserUseCase } from '@proarq/core/application/use-cases/create-user.use-case';
import { createUserSchema, updateUserSchema } from '@proarq/core/application/ports/in/create-user.input';
import { postgresUserRepo } from '../../driven/repositories/postgres-user.repository';

// Composition Root: wire use case → repository
const createUser = new CreateUserUseCase(postgresUserRepo);

export const router = Router();

router.post(
  '/',
  decodeJWT,
  checkRole('ADMIN'),
  validate(createUserSchema),
  createUserController(createUser),
);

router.get(
  '/',
  decodeJWT,
  checkRole('ADMIN'),
  listUsersController(createUser),
);

router.get(
  '/:id',
  decodeJWT,
  checkRole('ADMIN'),
  getUserController(createUser),
);

router.put(
  '/:id',
  decodeJWT,
  checkRole('ADMIN'),
  validate(updateUserSchema),
  updateUserController(createUser),
);

router.delete(
  '/:id',
  decodeJWT,
  checkRole('ADMIN'),
  deleteUserController(createUser),
);
