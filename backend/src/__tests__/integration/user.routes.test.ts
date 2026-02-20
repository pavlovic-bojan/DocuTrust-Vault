/**
 * Integration tests – user routes (DocuTrust Vault)
 * GET /api/v1/users (Admin only)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import * as userService from '../../usecases/user.service.js';
import { ApiError } from '../../utils/ApiError.js';

vi.mock('../../usecases/user.service.js');
vi.mock('../../infrastructure/db.js', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
  },
}));

const getApp = async () => {
  const { app } = await import('../../app.js');
  return app;
};

function signAdminToken(userId = 'admin-u1', companyId = 'c1') {
  return jwt.sign(
    { userId, email: 'admin@test.com', role: 'ADMIN', companyId },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );
}

describe('User routes integration', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { prisma } = await import('../../infrastructure/db.js');
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'admin-u1',
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      companyId: 'c1',
      status: 'ACTIVE',
    } as never);
  });

  describe('GET /api/v1/users', () => {
    it('should return 401 without token', async () => {
      const app = await getApp();

      await request(app).get('/api/v1/users').expect(401);
    });

    it('should return 401 with invalid token', async () => {
      const app = await getApp();

      await request(app)
        .get('/api/v1/users')
        .set('Authorization', 'Bearer invalid')
        .expect(401);
    });

    it('should return 200 with users when admin token', async () => {
      const app = await getApp();
      const mockUsers = [
        {
          userId: 'u1',
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
      vi.mocked(userService.listUsers).mockResolvedValue(mockUsers);

      const token = signAdminToken();

      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].email).toBe('admin@doctrust.local');
      expect(userService.listUsers).toHaveBeenCalledWith('c1', {});
    });

    it('should pass query params to listUsers', async () => {
      const app = await getApp();
      vi.mocked(userService.listUsers).mockResolvedValue([]);

      await request(app)
        .get('/api/v1/users?status=ACTIVE&role=USER&search=john')
        .set('Authorization', `Bearer ${signAdminToken()}`)
        .expect(200);

      expect(userService.listUsers).toHaveBeenCalledWith('c1', {
        status: 'ACTIVE',
        role: 'USER',
        search: 'john',
      });
    });

    it('should return 403 when user is not ADMIN', async () => {
      const app = await getApp();
      const { prisma } = await import('../../infrastructure/db.js');
      vi.clearAllMocks();
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-u1',
        email: 'user@test.com',
        firstName: 'Regular',
        lastName: 'User',
        role: 'USER',
        companyId: 'c1',
        status: 'ACTIVE',
      } as never);

      const token = jwt.sign(
        { userId: 'user-u1', email: 'user@test.com', role: 'USER', companyId: 'c1' },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('POST /api/v1/users', () => {
    it('should return 201 when user created', async () => {
      const app = await getApp();
      const created = {
        userId: 'u-new',
        companyId: 'c1',
        email: 'new@test.com',
        firstName: 'New',
        lastName: 'User',
        role: 'USER',
        status: 'ACTIVE',
        preferredLanguage: 'EN',
        createdAt: new Date(),
        lastLoginAt: null,
      };
      vi.mocked(userService.createUser).mockResolvedValue(created);

      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${signAdminToken()}`)
        .send({
          email: 'new@test.com',
          password: 'Password123!',
          firstName: 'New',
          lastName: 'User',
          role: 'USER',
        })
        .expect(201);

      expect(res.body.email).toBe('new@test.com');
      expect(res.body.firstName).toBe('New');
    });

    it('should return 400 when request validation fails', async () => {
      const app = await getApp();

      await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${signAdminToken()}`)
        .send({ email: 'invalid', password: 'short', firstName: '', lastName: '' })
        .expect(400);
    });

    it('should return 400 when service throws (e.g. email exists)', async () => {
      const app = await getApp();
      vi.mocked(userService.createUser).mockRejectedValue(
        new ApiError('Email already in use', 400, 'EMAIL_EXISTS')
      );

      await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${signAdminToken()}`)
        .send({
          email: 'existing@test.com',
          password: 'Password123!',
          firstName: 'First',
          lastName: 'Last',
          role: 'USER',
        })
        .expect(400);
    });
  });

  describe('PATCH /api/v1/users/:userId', () => {
    it('should return 200 when user updated', async () => {
      const app = await getApp();
      const updated = {
        userId: 'u1',
        companyId: 'c1',
        email: 'u@test.com',
        firstName: 'Updated',
        lastName: 'Name',
        role: 'USER',
        status: 'ACTIVE',
        preferredLanguage: 'EN',
        createdAt: new Date(),
        lastLoginAt: null,
      };
      vi.mocked(userService.updateUser).mockResolvedValue(updated);

      const res = await request(app)
        .patch('/api/v1/users/u1')
        .set('Authorization', `Bearer ${signAdminToken()}`)
        .send({ firstName: 'Updated', lastName: 'Name' })
        .expect(200);

      expect(res.body.firstName).toBe('Updated');
    });
  });

  describe('DELETE /api/v1/users/:userId', () => {
    it('should return 204 when user deleted', async () => {
      const app = await getApp();
      vi.mocked(userService.deleteUser).mockResolvedValue(undefined);

      await request(app)
        .delete('/api/v1/users/u1')
        .set('Authorization', `Bearer ${signAdminToken()}`)
        .expect(204);
    });
  });
});
