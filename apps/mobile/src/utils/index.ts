/**
 * Shared error logger for consistent error handling across the app.
 * In production, this could be swapped with a remote logging service.
 */
export const logger = {
  error: (_context: string, _error: unknown): void => {
    if (process.env.NODE_ENV !== 'test') {
    }
  },
  warn: (_context: string, _message: string): void => {
    if (process.env.NODE_ENV !== 'test') {
    }
  },
  info: (_context: string, _message: string): void => {
    if (process.env.NODE_ENV !== 'test') {
    }
  },
};
