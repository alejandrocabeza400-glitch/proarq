import type {
  CreateUserInput,
  UpdateUserInput,
} from '@proarq/core/application/ports/in/create-user.input';
import { userQuerySchema } from '@proarq/core/application/ports/in/create-user.input';
import type { CreateUserUseCase } from '@proarq/core/application/use-cases/create-user.use-case';
import type { NextFunction, Request, Response } from 'express';
import { generatePdfReport } from '../../../services/pdf.service';

export function createUserController(useCase: CreateUserUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await useCase.execute(req.body as CreateUserInput, req.user?.sub);
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
      const user = await useCase.update(req.params.id, req.body as UpdateUserInput, req.user?.sub);
      res.status(200).json({ data: user });
    } catch (err) {
      next(err);
    }
  };
}

export function deleteUserController(useCase: CreateUserUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await useCase.delete(req.params.id, req.user?.sub);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}

export function exportPdfUsersController(useCase: CreateUserUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = userQuerySchema.parse(req.query);
      const users = await useCase.findAll(query);

      const columns = [
        { header: 'Nombre', key: 'name', width: 140 },
        { header: 'Correo Electrónico', key: 'email', width: 190 },
        { header: 'Rol', key: 'role', width: 100, align: 'center' as const },
        {
          header: 'Creado En',
          key: 'createdAt',
          width: 72,
          align: 'center' as const,
          render: (val: any) => (val ? new Date(val).toLocaleDateString('es-ES') : '-'),
        },
      ];

      const pdfBuffer = await generatePdfReport('Listado de Usuarios Registrados', columns, users, {
        generatedBy: req.user?.sub || 'Usuario Registrado',
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=listado-usuarios.pdf');
      res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  };
}
