import { AppError } from './app.error';
import type { ZodError } from 'zod';

export class ValidationError extends AppError {
  public readonly details: ZodError['issues'];

  constructor(details: ZodError['issues']) {
    super('Validation failed', 400);
    this.details = details;
  }
}
