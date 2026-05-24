import type { Request, Response, NextFunction } from 'express';
import { SyncUseCase } from '@proarq/core/application/use-cases/sync.use-case';

export function syncController(useCase: SyncUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await useCase.execute(req.body);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  };
}
