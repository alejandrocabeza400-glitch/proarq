import { AppError } from './app.error';

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden: insufficient role') {
    super(message, 403);
  }
}
