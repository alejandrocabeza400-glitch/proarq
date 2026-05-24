import type {
  ForgotPasswordInput,
  LoginInput,
  RefreshInput,
  ResetPasswordInput,
} from '@proarq/core/application/ports/in/auth.input';
import type { AuthForgotPasswordUseCase } from '@proarq/core/application/use-cases/auth-forgot-password.use-case';
import type { AuthLoginUseCase } from '@proarq/core/application/use-cases/auth-login.use-case';
import type { AuthRefreshTokenUseCase } from '@proarq/core/application/use-cases/auth-refresh.use-case';
import type { AuthResetPasswordUseCase } from '@proarq/core/application/use-cases/auth-reset-password.use-case';
import type { NextFunction, Request, Response } from 'express';

export function createLoginController(useCase: AuthLoginUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await useCase.execute(req.body as LoginInput);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  };
}

export function createRefreshTokenController(useCase: AuthRefreshTokenUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await useCase.execute(req.body as RefreshInput);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  };
}

export function createForgotPasswordController(useCase: AuthForgotPasswordUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await useCase.execute(req.body as ForgotPasswordInput);
      res.status(200).json({ message: result.message });
    } catch (err) {
      next(err);
    }
  };
}

export function createResetPasswordController(useCase: AuthResetPasswordUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await useCase.execute(req.body as ResetPasswordInput);
      res.status(200).json({ message: result.message });
    } catch (err) {
      next(err);
    }
  };
}
