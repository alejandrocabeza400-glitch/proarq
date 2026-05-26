import type {
  CreateInsumoInput,
  UpdateInsumoInput,
} from '@proarq/core/application/ports/in/insumo.input';
import { insumoQuerySchema } from '@proarq/core/application/ports/in/insumo.input';
import type { ManageInsumoUseCase } from '@proarq/core/application/use-cases/manage-insumo.use-case';
import { parse } from 'csv-parse';
import type { NextFunction, Request, Response } from 'express';
import { finished as finishedStream } from 'node:stream';
import { promisify } from 'node:util';
import { generatePdfReport } from '../../../services/pdf.service';

const finished = promisify(finishedStream);

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
      if (!req.file?.buffer) {
        res.status(400).json({ error: 'CSV file is required' });
        return;
      }

      const records: any[] = [];
      const parser = parse(req.file.buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      parser.on('readable', () => {
        let record;
        while ((record = parser.read()) !== null) {
          records.push({
            codigo: record.codigo,
            nombre: record.nombre,
            unidad: record.unidad,
            costBase: record.cost_base,
          });
        }
      });

      await finished(parser);

      const result = await useCase.bulkUpload(records);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  };
}

export function exportPdfInsumosController(useCase: ManageInsumoUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = insumoQuerySchema.parse(req.query);
      const insumos = await useCase.findAll(query);

      const columns = [
        { header: 'Código', key: 'codigo', width: 100 },
        { header: 'Nombre del Insumo', key: 'nombre', width: 220 },
        { header: 'Unidad', key: 'unidad', width: 80, align: 'center' as const },
        {
          header: 'Costo Base',
          key: 'costBase',
          width: 102,
          align: 'right' as const,
          render: (val: any) =>
            val
              ? `$${Number(val).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : '$0.00',
        },
      ];

      const pdfBuffer = await generatePdfReport('Catálogo Maestro de Insumos', columns, insumos, {
        generatedBy: req.user?.sub || 'Usuario Registrado',
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=catalogo-insumos.pdf');
      res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  };
}
