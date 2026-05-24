import type {
  CreateCotizacionInput,
  UpdateCotizacionInput,
} from '@proarq/core/application/ports/in/cotizacion.input';
import { cotizacionQuerySchema } from '@proarq/core/application/ports/in/cotizacion.input';
import type { BranchCotizacionUseCase } from '@proarq/core/application/use-cases/branch-cotizacion.use-case';
import type { ManageCotizacionUseCase } from '@proarq/core/application/use-cases/manage-cotizacion.use-case';
import type { NextFunction, Request, Response } from 'express';
import PDFDocument from 'pdfkit';

export function createCotizacionController(useCase: ManageCotizacionUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body as CreateCotizacionInput;
      const userId = req.user?.sub ?? '';
      const cotizacion = await useCase.create({
        ...data,
        createdBy: userId,
      });
      res.status(201).json({ data: cotizacion });
    } catch (err) {
      next(err);
    }
  };
}

export function listCotizacionesController(useCase: ManageCotizacionUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = cotizacionQuerySchema.parse(req.query);
      const cotizaciones = await useCase.findAll(query);
      res.status(200).json({ data: cotizaciones });
    } catch (err) {
      next(err);
    }
  };
}

export function getCotizacionController(useCase: ManageCotizacionUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cotizacion = await useCase.findById(req.params.id);
      res.status(200).json({ data: cotizacion });
    } catch (err) {
      next(err);
    }
  };
}

export function updateCotizacionController(useCase: ManageCotizacionUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body as UpdateCotizacionInput;
      const cotizacion = await useCase.update(req.params.id, data);
      res.status(200).json({ data: cotizacion });
    } catch (err) {
      next(err);
    }
  };
}

export function branchCotizacionController(useCase: BranchCotizacionUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cotizacion = await useCase.execute(req.params.id);
      res.status(201).json({ data: cotizacion });
    } catch (err) {
      next(err);
    }
  };
}

export function pdfCotizacionController(getUseCase: ManageCotizacionUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cotizacion = await getUseCase.findById(req.params.id);
      if (!cotizacion) {
        res.status(404).json({ error: 'Cotizacion not found' });
        return;
      }

      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=cotizacion-${cotizacion.codigo}.pdf`,
      );
      doc.pipe(res);

      // Header
      doc.fontSize(20).text('COTIZACION', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Codigo: ${cotizacion.codigo}`);
      doc.text(`Version: ${cotizacion.version}`);
      doc.text(`Estado: ${cotizacion.estado}`);
      doc.text(`Projecto: ${cotizacion.projectoId}`);
      doc.moveDown();

      // Items table
      doc.fontSize(14).text('Items', { underline: true });
      doc.moveDown(0.5);

      if (cotizacion.items && cotizacion.items.length > 0) {
        for (const item of cotizacion.items) {
          doc
            .fontSize(10)
            .text(
              `APU: ${item.apuId} | Cantidad: ${item.cantidad} | Costo Directo: ${item.calculatedCostDirect}`,
            );
        }
      } else {
        doc.fontSize(10).text('No items');
      }

      doc.moveDown();

      // Totals
      doc.fontSize(14).text('Totales', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).text(`Costo Directo Total: ${cotizacion.totalCostDirect}`);
      doc.text(`Factor A: ${cotizacion.factorAPercentage}%`);
      doc.text(`Factor B: ${cotizacion.factorBPercentage}%`);
      doc.text(`Margen de Utilidad: ${cotizacion.profitMarginPercent}%`);
      doc.text(`Total: ${cotizacion.totalAmount}`);

      doc.end();
    } catch (err) {
      next(err);
    }
  };
}
