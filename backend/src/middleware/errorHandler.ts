import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';

/**
 * Central error handler. ApiError → statusCode + message; others → 500.
 * Never expose stack traces in production.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      message: err.message,
      code: err.code,
      ...(res.locals.validationErrors && { errors: res.locals.validationErrors }),
    });
    return;
  }

  const statusCode = 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error
        ? err.message
        : 'Unknown error';

  res.status(statusCode).json({ message, code: 'INTERNAL_ERROR' });
}
