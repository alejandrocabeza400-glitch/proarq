import type {
  AddApuInsumoInput,
  CreateApuInput,
  UpdateApuInput,
} from '@proarq/core/application/ports/in/apu.input';
import { apuQuerySchema } from '@proarq/core/application/ports/in/apu.input';
import type { ManageApuUseCase } from '@proarq/core/application/use-cases/manage-apu.use-case';
import type { NextFunction, Request, Response } from 'express';
import { generatePdfReport } from '../../../services/pdf.service';

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
      const apu = await useCase.update(req.params.id, data, req.user?.sub);
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
      const insumo = await useCase.addInsumo(
        req.params.id,
        {
          insumoId: data.insumoId,
          rendimiento: data.rendimiento,
          desperdicio: data.desperdicio ?? '0',
        },
        req.user?.sub,
      );
      res.status(201).json({ data: insumo });
    } catch (err) {
      next(err);
    }
  };
}

export function removeApuInsumoController(useCase: ManageApuUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await useCase.removeInsumo(req.params.id, req.params.itemId, req.user?.sub);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}

export function exportPdfApusController(useCase: ManageApuUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = apuQuerySchema.parse(req.query);
      const apus = await useCase.findAll(query);

      const columns = [
        { header: 'Código APU', key: 'codigo', width: 120 },
        { header: 'Nombre / Descripción', key: 'nombre', width: 250 },
        { header: 'Tipo', key: 'tipo', width: 132 },
      ];

      const pdfBuffer = await generatePdfReport(
        'Análisis de Precios Unitarios (APU)',
        columns,
        apus,
        { generatedBy: req.user?.sub || 'Usuario Registrado' },
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=catalogo-apus.pdf');
      res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  };
}
