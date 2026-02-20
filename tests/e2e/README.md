# Playwright Tests (API + E2E)

Playwright for API and E2E tests.

→ See [tests/README.md](../README.md) for overview.

## Setup

```bash
cd tests/e2e
npm install
cp .env.example .env   # optional – set TEST_USER_EMAIL, TEST_USER_PASSWORD for DocuTrust seed
```

## Running

```bash
# All tests (API + E2E)
npm run test

# API only (backend required)
npm run test:api

# E2E only (backend + frontend required)
npm run test:e2e

# From project root
npm run backend:dev    # terminal 1
npm run frontend:dev   # terminal 2
cd tests/e2e && npm run test
```

## Environment

| Variable | Description |
|----------|-------------|
| `API_BASE_URL` | Backend origin (default: http://localhost:4000). DocuTrust: `/health`, `/api/v1/auth/*`, `/api/v1/users` |
| `BASE_URL` | Frontend URL for E2E (default: http://localhost:5173) |
| `TEST_USER_EMAIL` | Test user (DocuTrust seed: admin@doctrust.local) |
| `TEST_USER_PASSWORD` | Test password (DocuTrust seed: Admin123!) |

## Structure

```
tests/e2e/
├── playwright.config.ts
├── tests/
│   ├── api/           # API tests
│   │   ├── health.spec.ts
│   │   ├── auth.spec.ts
│   │   └── users.spec.ts     # GET /api/v1/users (Admin only)
│   └── e2e/           # E2E tests
│       └── auth.spec.ts
├── pages/             # Page Objects (E2E)
├── lib/
│   └── schema-validator.ts
└── package.json
```

## Allure Report

```bash
npm run report
```
