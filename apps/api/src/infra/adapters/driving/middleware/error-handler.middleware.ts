import type { NextFunction, Request, Response } from 'express';
import { AppError } from '@proarq/core';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.statusCode === 400 && 'details' in err ? { details: (err as any).details } : {}),
    });
    return;
  }
  console.error('[UNEXPECTED ERROR]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { message: err.message }),
  });
}
