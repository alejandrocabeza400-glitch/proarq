import type { Request, Response, NextFunction } from 'express';
import type { ManageApuUseCase } from '@proarq/core/application/use-cases/manage-apu.use-case';
import type { CreateApuInput, UpdateApuInput, AddApuInsumoInput } from '@proarq/core/application/ports/in/apu.input';
import { apuQuerySchema } from '@proarq/core/application/ports/in/apu.input';

export function createApuController(useCase: ManageApuUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body as CreateApuInput;
      const userId = req.user?.sub ?? '';
      const apu = await useCase.create({ ...data, createdBy: userId });
      res.status(201).json({ data: apu });
    } catch (err) {
      next(err);
    }
  };
}

export function listApusController(useCase: ManageApuUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = apuQuerySchema.parse(req.query);
      const apus = await useCase.findAll(query);
      res.status(200).json({ data: apus });
    } catch (err) {
      next(err);
    }
  };
}

export function getApuController(useCase: ManageApuUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const apu = await useCase.findById(req.params.id);
      res.status(200).json({ data: apu });
    } catch (err) {
      next(err);
    }
  };
}

export function updateApuController(useCase: ManageApuUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body as UpdateApuInput;
      const apu = await useCase.update(req.params.id, data);
      res.status(200).json({ data: apu });
    } catch (err) {
      next(err);
    }
  };
}

export function addApuInsumoController(useCase: ManageApuUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body as AddApuInsumoInput;
      const insumo = await useCase.addInsumo(req.params.id, {
        insumoId: data.insumoId,
        rendimiento: data.rendimiento,
        desperdicio: data.desperdicio ?? '0',
      });
      res.status(201).json({ data: insumo });
    } catch (err) {
      next(err);
    }
  };
}

export function removeApuInsumoController(useCase: ManageApuUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await useCase.removeInsumo(req.params.id, req.params.itemId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
