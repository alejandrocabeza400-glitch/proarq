import type {
  CreateProyectoInput,
  UpdateProyectoInput,
} from '@proarq/core/application/ports/in/proyecto.input';
import { proyectoQuerySchema } from '@proarq/core/application/ports/in/proyecto.input';
import type { ManageProyectoUseCase } from '@proarq/core/application/use-cases/manage-proyecto.use-case';
import type { NextFunction, Request, Response } from 'express';
import { generatePdfReport } from '../../../services/pdf.service';

export function createProyectoController(useCase: ManageProyectoUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body as CreateProyectoInput;
      const userId = req.user?.sub ?? '';
      const proyecto = await useCase.create({ ...data, createdBy: userId });
      res.status(201).json({ data: proyecto });
    } catch (err) {
      next(err);
    }
  };
}

export function listProyectosController(useCase: ManageProyectoUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = proyectoQuerySchema.parse(req.query);
      const proyectos = await useCase.findAll(query);
      res.status(200).json({ data: proyectos });
    } catch (err) {
      next(err);
    }
  };
}

export function getProyectoController(useCase: ManageProyectoUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const proyecto = await useCase.findById(req.params.id);
      if (!proyecto) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }
      res.status(200).json({ data: proyecto });
    } catch (err) {
      next(err);
    }
  };
}

export function updateProyectoController(useCase: ManageProyectoUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body as UpdateProyectoInput;
      const proyecto = await useCase.update(req.params.id, data, req.user?.sub);
      res.status(200).json({ data: proyecto });
    } catch (err) {
      next(err);
    }
  };
}

export function deleteProyectoController(useCase: ManageProyectoUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await useCase.delete(req.params.id, req.user?.sub);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}

export function exportPdfProyectosController(useCase: ManageProyectoUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = proyectoQuerySchema.parse(req.query);
      const proyectos = await useCase.findAll(query);

      const columns = [
        { header: 'Código', key: 'codigo', width: 100 },
        { header: 'Nombre del Proyecto', key: 'nombre', width: 180 },
        { header: 'Estado', key: 'estado', width: 110, align: 'center' as const },
        { header: 'ID Cliente', key: 'clienteId', width: 112 },
      ];

      const pdfBuffer = await generatePdfReport('Listado de Proyectos', columns, proyectos, {
        generatedBy: req.user?.sub || 'Usuario Registrado',
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=listado-proyectos.pdf');
      res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  };
}
