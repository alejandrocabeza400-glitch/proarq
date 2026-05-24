import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  resetPasswordSchema,
} from '@proarq/core/application/ports/in/auth.input';
import { AuthForgotPasswordUseCase } from '@proarq/core/application/use-cases/auth-forgot-password.use-case';
import { AuthLoginUseCase } from '@proarq/core/application/use-cases/auth-login.use-case';
import { AuthRefreshTokenUseCase } from '@proarq/core/application/use-cases/auth-refresh.use-case';
import { AuthResetPasswordUseCase } from '@proarq/core/application/use-cases/auth-reset-password.use-case';
import { Router } from 'express';
import { env } from '../../../config/env';
import { postgresUserRepo } from '../../driven/repositories/postgres-user.repository';
import {
  createForgotPasswordController,
  createLoginController,
  createRefreshTokenController,
  createResetPasswordController,
} from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';

const loginUseCase = new AuthLoginUseCase(
  postgresUserRepo,
  env.JWT_SECRET,
  env.JWT_EXPIRES_IN,
  env.JWT_REFRESH_SECRET,
  env.JWT_REFRESH_EXPIRES_IN,
);
const forgotPasswordUseCase = new AuthForgotPasswordUseCase(postgresUserRepo);
const resetPasswordUseCase = new AuthResetPasswordUseCase(postgresUserRepo);
const refreshTokenUseCase = new AuthRefreshTokenUseCase(
  postgresUserRepo,
  env.JWT_SECRET,
  env.JWT_EXPIRES_IN,
  env.JWT_REFRESH_SECRET,
  env.JWT_REFRESH_EXPIRES_IN,
);

export const router = Router();

router.post('/login', validate(loginSchema), createLoginController(loginUseCase));
router.post('/refresh', validate(refreshSchema), createRefreshTokenController(refreshTokenUseCase));
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  createForgotPasswordController(forgotPasswordUseCase),
);
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  createResetPasswordController(resetPasswordUseCase),
);
