# DocuTrust Vault

Document Integrity & Compliance Management – multi-tenant SaaS for document storage, hash-based integrity verification, and audit trails.

## Stack

- **Backend:** Node.js, TypeScript, Express, Prisma, PostgreSQL
- **Frontend:** React 18, Vite, Tailwind CSS, TypeScript
- **Auth:** Email/password (login, forgot/reset) + JWT

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Database

- Create PostgreSQL database (e.g. `doctrust_vault`)
- Copy `backend/.env.example` → `backend/.env`
- Set `DATABASE_URL` and `JWT_SECRET` (min 32 chars)

```bash
cd backend
npx prisma db push     # or: npx prisma migrate dev --name init
npx prisma generate
npm run db:seed
```

### 3. Run backend

```bash
npm run backend:dev
```

- API: http://localhost:4000
- Swagger: http://localhost:4000/api-docs
- Health: http://localhost:4000/health

### 4. Run frontend

- Copy `frontend/.env.example` → `frontend/.env`
- Set `VITE_API_URL=http://localhost:4000` (or leave default)

```bash
npm run frontend:dev
```

- App: http://localhost:5173

### 5. Login

After seed, use:

| Email | Role | Password |
|-------|------|----------|
| admin@doctrust.local | ADMIN | Admin123! |
| user@doctrust.local | USER | User123! |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run backend:dev` | Start backend (tsx watch) |
| `npm run backend:build` | Build backend |
| `npm run backend:test` | Run backend tests |
| `npm run frontend:dev` | Start frontend (Vite) |
| `npm run frontend:build` | Build frontend |
| `npm run db:seed` | Seed database |

## Project Layout

- `backend/` – Express API, Prisma, Clean Architecture
- `frontend/` – React SPA, i18n (en, es, fr, sr-lat, sr-cyr)
- `docs/` – PRD, BRD, HLD, UI spec, OpenAPI
- `tests/` – Playwright (API + E2E), k6 performance

## Features

- **Users** (Admin): List, create, edit, delete users; role/status management
- **Documents**: Upload (PDF, DOCX), download, send (Email/Viber), logical delete; hash integrity status
- **Profile**: Edit name, email, preferred language
- **Report Bug**: Submit bug reports (optional, requires SMTP/BUG_REPORT_EMAIL)
- **Theme**: Light/dark mode
- **Responsive**: Mobile-friendly layout

See `docs/DocuTrust_Vault_PRD.md` and `docs/UI_SPEC.md` for details.
