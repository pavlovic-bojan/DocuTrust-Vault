import type { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

/**
 * Middleware to check express-validator validation result.
 * Must be placed after validation chain. Passes to next() or throws ApiError 400.
 */
export function validateRequest(req: Request, _res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
    return;
  }
  const arr = errors.array();
  const msg = arr.map((e) => (e.type === 'field' ? `${e.path}: ${e.msg}` : e.msg)).join('; ');
  next(new ApiError(msg, 400, 'VALIDATION_ERROR'));
}
