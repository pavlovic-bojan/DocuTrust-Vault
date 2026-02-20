/**
 * User service – DocuTrust Vault
 * Admin only: list users, create user
 */
import type { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../infrastructure/db.js';
import { ApiError } from '../utils/ApiError.js';

const SALT_ROUNDS = 10;

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'USER';
  preferredLanguage?: 'EN' | 'ES' | 'FR' | 'SR_LAT' | 'SR_CYR';
}

export async function createUser(
  companyId: string,
  createdByUserId: string,
  data: CreateUserInput
) {
  const email = data.email.trim().toLowerCase();
  if (!email) throw new ApiError('Email is required', 400, 'VALIDATION_ERROR');

  const existing = await prisma.user.findFirst({
    where: { email, companyId, logicalDeleted: false },
  });
  if (existing) throw new ApiError('Email already in use', 400, 'EMAIL_EXISTS');

  const password = data.password?.trim() ?? '';
  if (password.length < 8) throw new ApiError('Password must be at least 8 characters', 400, 'VALIDATION_ERROR');

  const firstName = data.firstName?.trim() ?? '';
  const lastName = data.lastName?.trim() ?? '';
  if (!firstName) throw new ApiError('First name is required', 400, 'VALIDATION_ERROR');
  if (!lastName) throw new ApiError('Last name is required', 400, 'VALIDATION_ERROR');

  const role = data.role && ['ADMIN', 'USER'].includes(data.role) ? data.role : 'USER';
  const preferredLanguage = data.preferredLanguage && ['EN', 'ES', 'FR', 'SR_LAT', 'SR_CYR'].includes(data.preferredLanguage)
    ? data.preferredLanguage
    : 'EN';

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      companyId,
      email,
      firstName,
      lastName,
      passwordHash,
      role,
      status: 'ACTIVE',
      preferredLanguage,
      createdBy: createdByUserId,
    },
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

export async function listUsers(
  companyId: string,
  options: { status?: string; role?: string; search?: string } = {}
) {
  const where: Prisma.UserWhereInput = {
    companyId,
    logicalDeleted: false,
  };

  if (options.status && ['ACTIVE', 'SUSPENDED', 'DELETED'].includes(options.status)) {
    where.status = options.status as 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  }

  if (options.role && ['ADMIN', 'USER'].includes(options.role)) {
    where.role = options.role as 'ADMIN' | 'USER';
  }

  if (options.search?.trim()) {
    const q = options.search.trim();
    where.OR = [
      { email: { contains: q, mode: 'insensitive' } },
      { firstName: { contains: q, mode: 'insensitive' } },
      { lastName: { contains: q, mode: 'insensitive' } },
    ] as Prisma.UserWhereInput['OR'];
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
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

  return users.map((u) => ({
    userId: u.id,
    companyId: u.companyId,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    status: u.status,
    preferredLanguage: u.preferredLanguage,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt,
  }));
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: 'ADMIN' | 'USER';
  status?: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  preferredLanguage?: 'EN' | 'ES' | 'FR' | 'SR_LAT' | 'SR_CYR';
  password?: string;
}

export async function updateUser(companyId: string, userId: string, data: UpdateUserInput) {
  const user = await prisma.user.findFirst({
    where: { id: userId, companyId, logicalDeleted: false },
  });
  if (!user) throw new ApiError('User not found', 404, 'NOT_FOUND');

  const updates: {
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: 'ADMIN' | 'USER';
    status?: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
    preferredLanguage?: 'EN' | 'ES' | 'FR' | 'SR_LAT' | 'SR_CYR';
    passwordHash?: string;
  } = {};

  if (data.firstName !== undefined) {
    const v = data.firstName?.trim() ?? '';
    if (!v) throw new ApiError('First name is required', 400, 'VALIDATION_ERROR');
    updates.firstName = v;
  }
  if (data.lastName !== undefined) {
    const v = data.lastName?.trim() ?? '';
    if (!v) throw new ApiError('Last name is required', 400, 'VALIDATION_ERROR');
    updates.lastName = v;
  }
  if (data.email !== undefined) {
    const email = data.email.trim().toLowerCase();
    if (!email) throw new ApiError('Email is required', 400, 'VALIDATION_ERROR');
    const existing = await prisma.user.findFirst({
      where: { email, companyId, logicalDeleted: false, id: { not: userId } },
    });
    if (existing) throw new ApiError('Email already in use', 400, 'EMAIL_EXISTS');
    updates.email = email;
  }
  if (data.role !== undefined && ['ADMIN', 'USER'].includes(data.role)) {
    updates.role = data.role;
  }
  if (data.status !== undefined && ['ACTIVE', 'SUSPENDED', 'DELETED'].includes(data.status)) {
    updates.status = data.status;
  }
  if (data.preferredLanguage !== undefined && ['EN', 'ES', 'FR', 'SR_LAT', 'SR_CYR'].includes(data.preferredLanguage)) {
    updates.preferredLanguage = data.preferredLanguage;
  }
  if (data.password !== undefined && data.password.trim()) {
    if (data.password.length < 8) throw new ApiError('Password must be at least 8 characters', 400, 'VALIDATION_ERROR');
    updates.passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  }

  if (Object.keys(updates).length === 0) {
    return mapUser(user);
  }

  const updated = await prisma.user.update({
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

  return mapUser(updated);
}

function mapUser(u: { id: string; companyId: string; email: string; firstName: string; lastName: string; role: string; status: string; preferredLanguage: string; createdAt: Date; lastLoginAt: Date | null }) {
  return {
    userId: u.id,
    companyId: u.companyId,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    status: u.status,
    preferredLanguage: u.preferredLanguage,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt,
  };
}

export async function deleteUser(companyId: string, userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, companyId, logicalDeleted: false },
  });
  if (!user) throw new ApiError('User not found', 404, 'NOT_FOUND');

  await prisma.user.update({
    where: { id: userId },
    data: { logicalDeleted: true, logicalDeletedAt: new Date(), status: 'DELETED' },
  });
}
