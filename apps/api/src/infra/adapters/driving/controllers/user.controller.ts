import type { Request, Response, NextFunction } from 'express';
import type { CreateUserUseCase } from '@proarq/core/application/use-cases/create-user.use-case';
import type { CreateUserInput, UpdateUserInput } from '@proarq/core/application/ports/in/create-user.input';
import { userQuerySchema } from '@proarq/core/application/ports/in/create-user.input';

export function createUserController(useCase: CreateUserUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await useCase.execute(req.body as CreateUserInput);
      res.status(201).json({ data: user });
    } catch (err) {
      next(err);
    }
  };
}

export function listUsersController(useCase: CreateUserUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = userQuerySchema.parse(req.query);
      const users = await useCase.findAll(query);
      res.status(200).json({ data: users });
    } catch (err) {
      next(err);
    }
  };
}

export function getUserController(useCase: CreateUserUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await useCase.findById(req.params.id);
      res.status(200).json({ data: user });
    } catch (err) {
      next(err);
    }
  };
}

export function updateUserController(useCase: CreateUserUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await useCase.update(req.params.id, req.body as UpdateUserInput);
      res.status(200).json({ data: user });
    } catch (err) {
      next(err);
    }
  };
}

export function deleteUserController(useCase: CreateUserUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await useCase.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
