import type { Request, Response, NextFunction } from 'express';
import type { AuthLoginUseCase } from '@proarq/core/application/use-cases/auth-login.use-case';
import type { AuthForgotPasswordUseCase } from '@proarq/core/application/use-cases/auth-forgot-password.use-case';
import type { AuthResetPasswordUseCase } from '@proarq/core/application/use-cases/auth-reset-password.use-case';
import type { LoginInput } from '@proarq/core/application/ports/in/auth.input';
import type { ForgotPasswordInput } from '@proarq/core/application/ports/in/auth.input';
import type { ResetPasswordInput } from '@proarq/core/application/ports/in/auth.input';

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
