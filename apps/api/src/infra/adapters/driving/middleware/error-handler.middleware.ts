import { AppError } from '@proarq/core';
import type { NextFunction, Request, Response } from 'express';
import postgres from 'postgres';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.statusCode === 400 && 'details' in err ? { details: (err as any).details } : {}),
    });
    return;
  }

  // Handle postgres-js database constraint errors
  if (err instanceof postgres.PostgresError) {
    if (err.code === '23503') {
      // foreign_key_violation
      const detail = err.detail || '';
      let message = 'Fallo en la integridad de datos: una clave externa referenciada no existe.';

      if (detail.includes('cliente_id')) {
        message = 'El cliente especificado (cliente_id) no existe.';
      } else if (detail.includes('projecto_id') || detail.includes('proyecto_id')) {
        message = 'El proyecto especificado (projecto_id) no existe.';
      } else if (detail.includes('created_by')) {
        message = 'El usuario creador (created_by) no existe.';
      } else if (detail.includes('apu_id')) {
        message = 'El APU especificado no existe.';
      }

      res.status(400).json({
        error: message,
        details: detail,
      });
      return;
    }

    if (err.code === '23505') {
      // unique_violation
      res.status(400).json({
        error: 'Ya existe un registro con estos datos únicos.',
        details: err.detail || '',
      });
      return;
    }
  }
  res.status(500).json({
    error: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { message: err.message }),
  });
}
