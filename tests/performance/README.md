# DocuTrust Vault – Performance Tests (k6)

k6 load tests for the DocuTrust Vault backend API.

→ See [tests/README.md](../README.md) for overview.

## Test Scenarios

| Test | Description | VUs | Duration |
|------|-------------|-----|----------|
| **smoke** | Health + auth/me | 1 | 3 iterations |
| **baseline** | Steady load | 2 | 1 min |
| **load** | Ramp 0→2 VUs | 2 | ~2 min |
| **stress** | Ramp 2→4 VUs | 4 | ~2 min |
| **spike** | Spike 2→4→2 VUs | 4 | ~1 min |
| **breakpoint** | Ramp 2→4 VUs | 4 | ~1.5 min |
| **soak** | 2 req/s, 1 min | 2–4 | 1 min |

## Prerequisites

- **k6** – standalone binary
  - macOS: `brew install k6`
  - Linux: [k6 docs](https://k6.io/docs/getting-started/installation/)

## Configuration

### Required

- `BASE_URL` – Backend URL (e.g. `http://localhost:4000`), no trailing slash

DocuTrust health: `GET /health`. Auth: `/api/v1/auth/login`, `/api/v1/auth/me`. Update `lib/config.js` and `lib/api.js` if paths differ.

### Optional

- `AUTH_TOKEN` – JWT for protected endpoints (auth/me). Without it, only health is tested.

### Example

```bash
# Health only (no token)
BASE_URL=http://localhost:4000 npm run smoke

# With token (login first, then set AUTH_TOKEN)
BASE_URL=http://localhost:4000 AUTH_TOKEN=eyJ... npm run smoke
```

## Running

### From tests/performance/

```bash
cd tests/performance
npm run smoke       # default for quick validation
npm run baseline
npm run load
npm run stress
npm run spike
npm run breakpoint
npm run soak
npm run all         # smoke + baseline + load
```

### Run script

```bash
cd tests/performance
chmod +x run.sh
BASE_URL=http://localhost:4000 ./run.sh smoke
./run.sh all
```

## HTML Report

Each run can generate an HTML report (if configured) at `tests/performance/k6-report/index.html`.

## Structure

```
tests/performance/
├── lib/
│   ├── config.js
│   ├── summary.js
│   ├── auth.js
│   ├── api.js
│   ├── scenarios.js
│   └── utils.js
├── smoke/
├── baseline/
├── load/
├── stress/
├── spike/
├── breakpoint/
├── soak/
├── run.sh
├── .env.example
└── package.json
```

## Endpoints

- `GET /health` – No auth
- `GET /api/v1/auth/me` – With JWT (when `AUTH_TOKEN` set)

Update `lib/config.js` endpoints to match DocuTrust API (`/api/v1/...`).
