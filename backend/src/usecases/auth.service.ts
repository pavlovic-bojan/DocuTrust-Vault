/**
 * Auth service – DocuTrust Vault
 * Per docs/OpenAPI.yaml: login, logout, getMe
 */
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { prisma } from '../infrastructure/db.js';
import { ApiError } from '../utils/ApiError.js';

const SALT_ROUNDS = 10;

function issueJwt(userId: string, email: string, role: string, companyId: string): string {
  return jwt.sign(
    { userId, email, role, companyId },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export interface LoginResult {
  token: string;
  user: {
    userId: string;
    companyId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    status: string;
    preferredLanguage: string;
    createdAt: Date;
    lastLoginAt: Date | null;
  };
  expiresAt: string;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { company: true },
  });

  if (!user || !user.passwordHash) {
    throw new ApiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new ApiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  if (user.status !== 'ACTIVE') {
    throw new ApiError('Account is not active', 403, 'ACCOUNT_DISABLED');
  }

  if (user.company.status !== 'ACTIVE') {
    throw new ApiError('Company is not active', 403, 'COMPANY_INACTIVE');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const token = issueJwt(user.id, user.email, user.role, user.companyId);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  return {
    token,
    user: {
      userId: user.id,
      companyId: user.companyId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      preferredLanguage: user.preferredLanguage,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    },
    expiresAt: expiresAt.toISOString(),
  };
}

export async function forgotPassword(email: string): Promise<{ ok: boolean }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { ok: true };
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  await prisma.passwordResetToken.create({
    data: { token, userId: user.id, expiresAt },
  });

  // TODO: Send email with reset link (e.g. /reset-password?token=...)
  // For now we just create the token; in production integrate SMTP
  return { ok: true };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      companyId: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      preferredLanguage: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  if (!user) {
    throw new ApiError('User not found', 404, 'NOT_FOUND');
  }

  return {
    userId: user.id,
    companyId: user.companyId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status,
    preferredLanguage: user.preferredLanguage,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

export async function updateProfile(
  userId: string,
  data: { firstName?: string; lastName?: string; email?: string; preferredLanguage?: string }
) {
  const updates: { firstName?: string; lastName?: string; email?: string; preferredLanguage?: string } = {};

  if (data.firstName !== undefined && data.firstName.trim()) updates.firstName = data.firstName.trim();
  if (data.lastName !== undefined && data.lastName.trim()) updates.lastName = data.lastName.trim();
  if (data.preferredLanguage !== undefined && ['EN', 'ES', 'FR', 'SR_LAT', 'SR_CYR'].includes(data.preferredLanguage)) {
    updates.preferredLanguage = data.preferredLanguage as 'EN' | 'ES' | 'FR' | 'SR_LAT' | 'SR_CYR';
  }
  if (data.email !== undefined) {
    const email = data.email.trim();
    if (!email) throw new ApiError('Email is required', 400, 'VALIDATION_ERROR');
    const existing = await prisma.user.findFirst({ where: { email, id: { not: userId } } });
    if (existing) throw new ApiError('Email already in use', 400, 'EMAIL_EXISTS');
    updates.email = email;
  }

  if (Object.keys(updates).length === 0) {
    return getMe(userId);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updates,
    select: {
      id: true,
      companyId: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      preferredLanguage: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  return {
    userId: user.id,
    companyId: user.companyId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status,
    preferredLanguage: user.preferredLanguage,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}
