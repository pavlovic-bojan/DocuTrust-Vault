import { test, expect } from '@playwright/test';
import { validateAgainstSchema, schemas } from '../../lib/schema-validator';

async function getAuthToken(request: import('@playwright/test').APIRequestContext): Promise<string | null> {
  const loginRes = await request.post('/api/v1/auth/login', {
    data: {
      email: process.env.TEST_USER_EMAIL ?? 'admin@doctrust.local',
      password: process.env.TEST_USER_PASSWORD ?? 'Admin123!',
    },
  });
  if (!loginRes.ok()) return null;
  const body = await loginRes.json();
  return body.token ?? null;
}

test.describe('Users API - DocuTrust Vault (Admin only)', () => {
  test('GET /api/v1/users with Admin token returns 200 and array', async ({ request }) => {
    const authToken = await getAuthToken(request);
    if (!authToken) {
      test.skip(true, 'No auth token - run db:seed for admin@doctrust.local');
    }

    const response = await request.get('/api/v1/users', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    if (body.length > 0) {
      const result = validateAgainstSchema(body, schemas.usersList);
      expect(result.valid, result.errors?.join('; ')).toBe(true);
    }
  });

  test('GET /api/v1/users without token returns 401', async ({ request }) => {
    const response = await request.get('/api/v1/users');
    expect(response.status()).toBe(401);
  });
});
