import { defineConfig, devices } from '@playwright/test';

// DocuTrust: base URL. Health at /health, API at /api/v1/...
const apiBaseURL = process.env.API_BASE_URL ?? 'http://localhost:4000';
const e2eBaseURL = process.env.BASE_URL ?? 'http://localhost:5173';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['list'],
    [
      'allure-playwright',
      {
        detail: true,
        suiteTitle: true,
        outputFolder: 'allure-results',
      },
    ],
  ],
  projects: [
    {
      name: 'api',
      testMatch: /tests\/e2e\/tests\/api\/.*\.spec\.ts/,
      use: {
        baseURL: apiBaseURL,
        extraHTTPHeaders: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
    },
    {
      name: 'e2e',
      testMatch: /tests\/e2e\/tests\/e2e\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: e2eBaseURL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
      },
    },
  ],
  timeout: 30000,
  expect: { timeout: 10000 },
});
