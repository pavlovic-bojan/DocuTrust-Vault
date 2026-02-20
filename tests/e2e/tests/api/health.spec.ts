import { test, expect } from '@playwright/test';
import { validateAgainstSchema, schemas } from '../../lib/schema-validator';

test.describe('Health API - JSON Schema Validation', () => {
  test('GET /health returns 200 and matches schema', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.status()).toBe(200);

    const body = await response.json();
    const result = validateAgainstSchema(body, schemas.health);
    expect(result.valid, result.errors?.join('; ')).toBe(true);
    expect(body).toEqual({ status: 'ok' });
  });
});
