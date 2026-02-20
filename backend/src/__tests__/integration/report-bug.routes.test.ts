/**
 * Integration tests – report-bug routes
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../../infrastructure/db.js', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
  },
}));

vi.mock('../../infrastructure/email.js', () => ({
  sendBugReport: vi.fn().mockResolvedValue(true),
}));

const getApp = async () => {
  const { app } = await import('../../app.js');
  return app;
};

function signToken(userId = 'u1', companyId = 'c1') {
  return jwt.sign(
    { userId, email: 'user@test.com', role: 'USER', companyId },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );
}

describe('Report bug routes integration', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { prisma } = await import('../../infrastructure/db.js');
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u1',
      email: 'user@test.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'USER',
      companyId: 'c1',
      status: 'ACTIVE',
    } as never);
  });

  describe('POST /api/v1/report-bug', () => {
    it('should return 401 without token', async () => {
      const app = await getApp();
      await request(app)
        .post('/api/v1/report-bug')
        .send({ subject: 'Bug', description: 'Test' })
        .expect(401);
    });

    it('should return 200 when report sent', async () => {
      const app = await getApp();
      const { sendBugReport } = await import('../../infrastructure/email.js');

      const res = await request(app)
        .post('/api/v1/report-bug')
        .set('Authorization', `Bearer ${signToken()}`)
        .send({ subject: 'Bug title', description: 'Bug details' })
        .expect(200);

      expect(res.body.ok).toBe(true);
      expect(sendBugReport).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Bug title',
          description: 'Bug details',
        })
      );
    });

    it('should return 400 when validation fails', async () => {
      const app = await getApp();
      await request(app)
        .post('/api/v1/report-bug')
        .set('Authorization', `Bearer ${signToken()}`)
        .send({ subject: '', description: '' })
        .expect(400);
    });
  });
});
