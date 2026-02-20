# DocuTrust Vault Tests

Test suites: **Playwright** (API + E2E) and **k6** (performance).

## Overview

| Suite | Location | Description |
|-------|----------|-------------|
| **API** | [e2e/tests/api/](e2e/) | Playwright API tests |
| **E2E** | [e2e/tests/e2e/](e2e/) | Playwright E2E tests (browser) |
| **Performance** | [performance/](performance/) | k6 load tests |

## Quick Start

```bash
# From project root – ensure backend is running first
npm run backend:dev

# API tests (backend required)
npm run tests:api

# E2E tests (backend + frontend required)
npm run frontend:dev   # in one terminal
npm run tests:e2e     # in another

# Performance – smoke (k6 required: brew install k6)
BASE_URL=http://localhost:4000 npm run tests:performance
# Or from tests/performance: BASE_URL=http://localhost:4000 npm run smoke
```

## Environment

| Variable | Description |
|----------|-------------|
| `API_BASE_URL` | Backend origin (default: http://localhost:4000) |
| `BASE_URL` | Frontend URL for E2E (default: http://localhost:5173) |
| `TEST_USER_EMAIL` | Seed user (DocuTrust: admin@doctrust.local) |
| `TEST_USER_PASSWORD` | Seed password (DocuTrust: Admin123!) |

**Note:** API tests expect backend at `API_BASE_URL`. DocuTrust uses `/api/v1/auth`, `/health`. If tests reference different paths, update the test files or configure proxy accordingly.

## Subfolders

- **[e2e/](e2e/)** – Playwright (API + E2E), Allure reports
- **[performance/](performance/)** – k6 performance tests (smoke, baseline, load, …)
