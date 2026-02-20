import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../../infrastructure/email.js', () => ({
  sendBugReport: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../infrastructure/db.js', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
  },
}));

const getApp = async () => {
  const { app } = await import('../../app.js');
  return app;
};

function signUserToken(userId = 'user-u1', companyId = 'c1') {
  return jwt.sign(
    { userId, email: 'user@test.com', role: 'USER', companyId },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );
}

describe('Report Bug routes', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { prisma } = await import('../../infrastructure/db.js');
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-u1',
      email: 'user@test.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'USER',
      companyId: 'c1',
      status: 'ACTIVE',
    } as never);
  });

  it('POST /report-bug with valid body returns 200', async () => {
    const app = await getApp();
    const token = signUserToken();

    const res = await request(app)
      .post('/api/v1/report-bug')
      .set('Authorization', `Bearer ${token}`)
      .send({ subject: 'Bug title', description: 'Bug description' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const { sendBugReport } = await import('../../infrastructure/email.js');
    expect(sendBugReport).toHaveBeenCalledWith({
      to: expect.any(String),
      fromUser: 'Test User (user@test.com)',
      subject: 'Bug title',
      description: 'Bug description',
    });
  });

  it('POST /report-bug without auth returns 401', async () => {
    const app = await getApp();

    const res = await request(app)
      .post('/api/v1/report-bug')
      .send({ subject: 'Bug', description: 'Desc' });

    expect(res.status).toBe(401);
  });

  it('POST /report-bug with empty subject returns 400', async () => {
    const app = await getApp();
    const token = signUserToken();

    const res = await request(app)
      .post('/api/v1/report-bug')
      .set('Authorization', `Bearer ${token}`)
      .send({ subject: '', description: 'Desc' });

    expect(res.status).toBe(400);
  });
});
