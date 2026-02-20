/**
 * Integration tests – health endpoint
 */
import { describe, it, expect } from 'vitest';
import request from 'supertest';

const getApp = async () => {
  const { app } = await import('../../app.js');
  return app;
};

describe('Health route', () => {
  it('GET /health returns 200 with status ok', async () => {
    const app = await getApp();

    const res = await request(app).get('/health').expect(200);

    expect(res.body).toEqual({ status: 'ok' });
  });
});
