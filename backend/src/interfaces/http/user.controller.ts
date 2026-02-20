/**
 * User controller – DocuTrust Vault (Admin only)
 */
import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth.js';
import { ApiError } from '../../utils/ApiError.js';
import * as userService from '../../usecases/user.service.js';

export async function listUsers(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) throw new ApiError('Unauthorized', 401);
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const role = typeof req.query.role === 'string' ? req.query.role : undefined;
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const users = await userService.listUsers(req.user.companyId, { status, role, search });
  res.json(users);
}

export async function createUser(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) throw new ApiError('Unauthorized', 401);
  const body = req.body as {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    preferredLanguage?: string;
  };
  const user = await userService.createUser(req.user.companyId, req.user.id, {
    email: body.email ?? '',
    password: body.password ?? '',
    firstName: body.firstName ?? '',
    lastName: body.lastName ?? '',
    role: body.role === 'ADMIN' ? 'ADMIN' : 'USER',
    preferredLanguage: body.preferredLanguage as 'EN' | 'ES' | 'FR' | 'SR_LAT' | 'SR_CYR' | undefined,
  });
  res.status(201).json(user);
}

export async function updateUser(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) throw new ApiError('Unauthorized', 401);
  const userId = req.params.userId;
  if (!userId) throw new ApiError('User ID required', 400, 'VALIDATION_ERROR');
  const body = req.body as {
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
    status?: string;
    preferredLanguage?: string;
    password?: string;
  };
  const user = await userService.updateUser(req.user.companyId, userId, {
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    role: body.role === 'ADMIN' ? 'ADMIN' : body.role === 'USER' ? 'USER' : undefined,
    status: body.status as 'ACTIVE' | 'SUSPENDED' | 'DELETED' | undefined,
    preferredLanguage: body.preferredLanguage as 'EN' | 'ES' | 'FR' | 'SR_LAT' | 'SR_CYR' | undefined,
    password: body.password,
  });
  res.json(user);
}

export async function deleteUser(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) throw new ApiError('Unauthorized', 401);
  const userId = req.params.userId;
  if (!userId) throw new ApiError('User ID required', 400, 'VALIDATION_ERROR');
  await userService.deleteUser(req.user.companyId, userId);
  res.status(204).send();
}
