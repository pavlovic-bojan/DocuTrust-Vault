/**
 * Auth middleware – DocuTrust Vault
 * JWT auth, sets req.user with id, email, companyId, role, firstName, lastName
 */
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../infrastructure/db.js';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  companyId: string;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    companyId: string;
  };
}

export async function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next(new ApiError('Unauthorized', 401, 'UNAUTHORIZED'));
    return;
  }

  const token = authHeader.slice(7);
  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch {
    next(new ApiError('Invalid or expired token', 401, 'UNAUTHORIZED'));
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      companyId: true,
      status: true,
    },
  });

  if (!user) {
    next(new ApiError('User not found', 401, 'UNAUTHORIZED'));
    return;
  }

  if (user.status !== 'ACTIVE') {
    next(new ApiError('Account is not active', 403, 'ACCOUNT_DISABLED'));
    return;
  }

  req.user = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    companyId: user.companyId,
  };
  next();
}

export function requireAdmin(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    next(new ApiError('Unauthorized', 401, 'UNAUTHORIZED'));
    return;
  }
  if (req.user.role !== 'ADMIN') {
    next(new ApiError('Admin only', 403, 'FORBIDDEN'));
    return;
  }
  next();
}
