/**
 * Unit tests – auth.service (DocuTrust Vault)
 * login, getMe
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authService from '../../usecases/auth.service.js';

vi.mock('../../infrastructure/db.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    passwordResetToken: { create: vi.fn() },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn((plain: string, hash: string) =>
      Promise.resolve(hash === `hashed_${plain}`)
    ),
  },
}));

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should return token and user when credentials valid', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      const mockUser = {
        id: 'u1',
        email: 'admin@doctrust.local',
        passwordHash: 'hashed_Admin123!',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        status: 'ACTIVE',
        preferredLanguage: 'EN',
        companyId: 'c1',
        createdAt: new Date(),
        lastLoginAt: null,
        company: { status: 'ACTIVE' },
      };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);
      vi.mocked(prisma.user.update).mockResolvedValue({ ...mockUser, lastLoginAt: new Date() } as never);

      const result = await authService.login('admin@doctrust.local', 'Admin123!');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expiresAt');
      expect(result.user).toMatchObject({
        userId: 'u1',
        companyId: 'c1',
        email: 'admin@doctrust.local',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: expect.any(Object),
      });
    });

    it('should throw when user not found', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(
        authService.login('unknown@test.com', 'Password123!')
      ).rejects.toMatchObject({ statusCode: 401, code: 'INVALID_CREDENTIALS' });
    });

    it('should throw when no password hash', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'u1',
        email: 'u@test.com',
        passwordHash: null,
      } as never);

      await expect(
        authService.login('u@test.com', 'Password123!')
      ).rejects.toMatchObject({ statusCode: 401, code: 'INVALID_CREDENTIALS' });
    });

    it('should throw when password invalid', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'u1',
        email: 'u@test.com',
        passwordHash: 'hashed_WrongPassword',
        status: 'ACTIVE',
        company: { status: 'ACTIVE' },
      } as never);

      await expect(
        authService.login('u@test.com', 'Admin123!')
      ).rejects.toMatchObject({ statusCode: 401, code: 'INVALID_CREDENTIALS' });
    });

    it('should throw when user status not ACTIVE', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'u1',
        email: 'u@test.com',
        passwordHash: 'hashed_Admin123!',
        status: 'SUSPENDED',
        company: { status: 'ACTIVE' },
      } as never);

      await expect(
        authService.login('u@test.com', 'Admin123!')
      ).rejects.toMatchObject({ statusCode: 403, code: 'ACCOUNT_DISABLED' });
    });

    it('should throw when company inactive', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'u1',
        email: 'u@test.com',
        passwordHash: 'hashed_Admin123!',
        status: 'ACTIVE',
        company: { status: 'INACTIVE' },
      } as never);

      await expect(
        authService.login('u@test.com', 'Admin123!')
      ).rejects.toMatchObject({ statusCode: 403, code: 'COMPANY_INACTIVE' });
    });
  });

  describe('getMe', () => {
    it('should return user when found', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      const mockUser = {
        id: 'u1',
        companyId: 'c1',
        email: 'admin@doctrust.local',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        status: 'ACTIVE',
        preferredLanguage: 'EN',
        createdAt: new Date(),
        lastLoginAt: null,
      };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);

      const result = await authService.getMe('u1');

      expect(result).toMatchObject({
        userId: 'u1',
        companyId: 'c1',
        email: 'admin@doctrust.local',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'u1' },
        select: expect.any(Object),
      });
    });

    it('should throw when user not found', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(authService.getMe('none')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    });
  });

  describe('updateProfile', () => {
    it('should update firstName and lastName', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      const updated = {
        id: 'u1',
        companyId: 'c1',
        email: 'user@test.com',
        firstName: 'NewFirst',
        lastName: 'NewLast',
        role: 'USER',
        status: 'ACTIVE',
        preferredLanguage: 'EN',
        createdAt: new Date(),
        lastLoginAt: null,
      };
      vi.mocked(prisma.user.update).mockResolvedValue(updated as never);

      const result = await authService.updateProfile('u1', {
        firstName: 'NewFirst',
        lastName: 'NewLast',
      });

      expect(result.firstName).toBe('NewFirst');
      expect(result.lastName).toBe('NewLast');
    });

    it('should throw when email already in use', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: 'other' } as never);

      await expect(
        authService.updateProfile('u1', { email: 'existing@test.com' })
      ).rejects.toMatchObject({ statusCode: 400, code: 'EMAIL_EXISTS' });
    });
  });

  describe('forgotPassword', () => {
    it('should return ok when user exists and create token', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'u1',
        email: 'user@test.com',
      } as never);
      vi.mocked(prisma.passwordResetToken.create).mockResolvedValue({} as never);

      const result = await authService.forgotPassword('user@test.com');

      expect(result).toEqual({ ok: true });
      expect(prisma.passwordResetToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'u1',
          token: expect.any(String),
        }),
      });
    });

    it('should return ok when user does not exist (no leak)', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await authService.forgotPassword('nonexistent@test.com');

      expect(result).toEqual({ ok: true });
      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
    });
  });
});
