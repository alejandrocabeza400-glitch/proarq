import type { Request, Response, NextFunction } from 'express';
import type { ManageInsumoUseCase } from '@proarq/core/application/use-cases/manage-insumo.use-case';
import type { CreateInsumoInput, UpdateInsumoInput } from '@proarq/core/application/ports/in/insumo.input';
import { insumoQuerySchema } from '@proarq/core/application/ports/in/insumo.input';
import { parse } from 'csv-parse/sync';

export function createInsumoController(useCase: ManageInsumoUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body as CreateInsumoInput;
      const userId = req.user?.sub ?? '';
      const insumo = await useCase.create({
        ...data,
        createdBy: userId,
      });
      res.status(201).json({ data: insumo });
    } catch (err) {
      next(err);
    }
  };
}

export function listInsumosController(useCase: ManageInsumoUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = insumoQuerySchema.parse(req.query);
      const insumos = await useCase.findAll(query);
      res.status(200).json({ data: insumos });
    } catch (err) {
      next(err);
    }
  };
}

export function getInsumoController(useCase: ManageInsumoUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const insumo = await useCase.findById(req.params.id);
      res.status(200).json({ data: insumo });
    } catch (err) {
      next(err);
    }
  };
}

export function updateInsumoController(useCase: ManageInsumoUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body as UpdateInsumoInput;
      const userId = req.user?.sub ?? '';
      const insumo = await useCase.update(req.params.id, {
        ...data,
        userId,
      });
      res.status(200).json({ data: insumo });
    } catch (err) {
      next(err);
    }
  };
}

export function deleteInsumoController(useCase: ManageInsumoUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.sub ?? '';
      await useCase.delete(req.params.id, userId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}

export function bulkUploadInsumoController(useCase: ManageInsumoUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file || !req.file.buffer) {
        res.status(400).json({ error: 'CSV file is required' });
        return;
      }

      const csvContent = req.file.buffer.toString('utf-8');
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      const rows = records.map((record: Record<string, string>) => ({
        codigo: record.codigo,
        nombre: record.nombre,
        unidad: record.unidad,
        costBase: record.cost_base,
      }));

      const result = await useCase.bulkUpload(rows);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  };
}
