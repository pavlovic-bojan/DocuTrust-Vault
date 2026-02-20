/**
 * Unit tests – user.service (DocuTrust Vault)
 * listUsers
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as userService from '../../usecases/user.service.js';

vi.mock('../../infrastructure/db.js', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn((plain: string) => Promise.resolve(`hashed_${plain}`)),
  },
}));

describe('user.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listUsers', () => {
    it('should return users for company with logicalDeleted false', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      const mockUsers = [
        {
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
        },
      ];
      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as never);

      const result = await userService.listUsers('c1');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        userId: 'u1',
        companyId: 'c1',
        email: 'admin@doctrust.local',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
      });
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { companyId: 'c1', logicalDeleted: false },
        orderBy: { createdAt: 'desc' },
        select: expect.any(Object),
      });
    });

    it('should filter by status when provided', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      await userService.listUsers('c1', { status: 'ACTIVE' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ACTIVE' }),
        })
      );
    });

    it('should filter by role when provided', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      await userService.listUsers('c1', { role: 'USER' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: 'USER' }),
        })
      );
    });

    it('should filter by search when provided', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      await userService.listUsers('c1', { search: 'john' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      );
    });

    it('should return empty array when no users', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      const result = await userService.listUsers('c1');

      expect(result).toEqual([]);
    });
  });

  describe('createUser', () => {
    it('should create user when valid data', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 'u-new',
        companyId: 'c1',
        email: 'new@test.com',
        firstName: 'New',
        lastName: 'User',
        role: 'USER',
        status: 'ACTIVE',
        preferredLanguage: 'EN',
        createdAt: new Date(),
        lastLoginAt: null,
      } as never);

      const result = await userService.createUser('c1', 'admin-u1', {
        email: 'new@test.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'User',
        role: 'USER',
      });

      expect(result.userId).toBe('u-new');
      expect(result.email).toBe('new@test.com');
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'new@test.com',
            firstName: 'New',
            lastName: 'User',
            role: 'USER',
          }),
        })
      );
    });

    it('should throw when email already exists', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: 'existing' } as never);

      await expect(
        userService.createUser('c1', 'admin-u1', {
          email: 'existing@test.com',
          password: 'Password123!',
          firstName: 'First',
          lastName: 'Last',
          role: 'USER',
        })
      ).rejects.toMatchObject({ statusCode: 400, code: 'EMAIL_EXISTS' });
    });

    it('should throw when password too short', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      await expect(
        userService.createUser('c1', 'admin-u1', {
          email: 'new@test.com',
          password: 'short',
          firstName: 'First',
          lastName: 'Last',
          role: 'USER',
        })
      ).rejects.toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' });
    });
  });

  describe('updateUser', () => {
    it('should update user when valid data', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      const existing = {
        id: 'u1',
        companyId: 'c1',
        email: 'u@test.com',
        firstName: 'Old',
        lastName: 'Name',
        role: 'USER',
        status: 'ACTIVE',
        preferredLanguage: 'EN',
        createdAt: new Date(),
        lastLoginAt: null,
      };
      vi.mocked(prisma.user.findFirst).mockResolvedValue(existing as never);
      vi.mocked(prisma.user.update).mockResolvedValue({
        ...existing,
        firstName: 'NewFirst',
        lastName: 'NewLast',
      } as never);

      const result = await userService.updateUser('c1', 'u1', {
        firstName: 'NewFirst',
        lastName: 'NewLast',
      });

      expect(result.firstName).toBe('NewFirst');
      expect(result.lastName).toBe('NewLast');
    });

    it('should throw 404 when user not found', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      await expect(
        userService.updateUser('c1', 'none', { firstName: 'New' })
      ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' });
    });

    it('should throw when email already in use by another user', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      vi.mocked(prisma.user.findFirst)
        .mockResolvedValueOnce({ id: 'u1', companyId: 'c1' } as never)
        .mockResolvedValueOnce({ id: 'other' } as never);

      await expect(
        userService.updateUser('c1', 'u1', { email: 'taken@test.com' })
      ).rejects.toMatchObject({ statusCode: 400, code: 'EMAIL_EXISTS' });
    });
  });

  describe('deleteUser', () => {
    it('should logically delete user', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      vi.mocked(prisma.user.findFirst).mockResolvedValue({
        id: 'u1',
        companyId: 'c1',
      } as never);
      vi.mocked(prisma.user.update).mockResolvedValue({} as never);

      await userService.deleteUser('c1', 'u1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: expect.objectContaining({ logicalDeleted: true, status: 'DELETED' }),
      });
    });

    it('should throw 404 when user not found', async () => {
      const { prisma } = await import('../../infrastructure/db.js');
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      await expect(userService.deleteUser('c1', 'none')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    });
  });
});
