/**
 * Auth controller – DocuTrust Vault
 * Per docs/OpenAPI.yaml: login, logout, getMe
 */
import type { Response } from 'express';
import { body, validationResult } from 'express-validator';
import type { AuthRequest } from '../../middleware/auth.js';
import { ApiError } from '../../utils/ApiError.js';
import * as authService from '../../usecases/auth.service.js';

export async function login(req: AuthRequest, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  const { email, password } = req.body as { email: string; password: string };
  const result = await authService.login(email, password);
  res.json(result);
}

export async function logout(_req: AuthRequest, res: Response): Promise<void> {
  // Stateless JWT – client discards token. Optional: blacklist in Redis.
  res.status(200).json({ message: 'Logged out' });
}

export async function forgotPassword(req: AuthRequest, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  const { email } = req.body as { email: string };
  await authService.forgotPassword(email);
  res.json({ ok: true, message: 'If an account exists, a reset link has been sent.' });
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) throw new ApiError('Unauthorized', 401);
  const user = await authService.getMe(req.user.id);
  res.json(user);
}

export async function updateMe(req: AuthRequest, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  if (!req.user) throw new ApiError('Unauthorized', 401);
  const { firstName, lastName, email, preferredLanguage } = req.body as {
    firstName?: string;
    lastName?: string;
    email?: string;
    preferredLanguage?: string;
  };
  const user = await authService.updateProfile(req.user.id, {
    firstName,
    lastName,
    email,
    preferredLanguage,
  });
  res.json(user);
}
