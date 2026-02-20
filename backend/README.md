# Backend – DocuTrust Vault API

Express + TypeScript API with Prisma (PostgreSQL), JWT auth.

## Setup

1. Copy `.env.example` to `.env`
2. Set `DATABASE_URL`, `JWT_SECRET` (min 32 chars)
3. Optional: `BUG_REPORT_EMAIL`, SMTP settings for Report Bug
4. Run migrations and seed:

```bash
npx prisma db push     # or: npx prisma migrate dev
npx prisma generate
npm run db:seed
```

5. Start backend: `npm run dev` (from `backend/` or `npm run backend:dev` from root)

## Run

- Dev: `npm run dev`
- Test: `npm run test`
- Build: `npm run build` then `npm start`

## API

- Base: http://localhost:4000
- Swagger: http://localhost:4000/api-docs
- Health: `GET /health` → `{ status: "ok" }`

### Auth (prefix: `/api/v1/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /login | No | email, password → user + token |
| POST | /forgot-password | No | email → sends reset link |
| POST | /reset-password | No | token, newPassword |
| GET | /me | Yes | Current user |
| PATCH | /profile | Yes | Update profile (firstName, lastName, email, preferredLanguage) |
| POST | /logout | Yes | Invalidate session |

### Users (prefix: `/api/v1/users`) – Admin only

| Method | Path | Description |
|--------|------|-------------|
| GET | / | List users |
| POST | / | Create user |
| PATCH | /:userId | Update user |
| DELETE | /:userId | Logical delete user |

### Documents (prefix: `/api/v1/documents`)

| Method | Path | Description |
|--------|------|-------------|
| GET | / | List documents |
| POST | / | Upload (multipart, PDF/DOCX) |
| GET | /:id | Get metadata |
| GET | /:id/download | Download file |
| POST | /:id/send | Send via Email/Viber |
| DELETE | /:id | Logical delete |
| GET | /:id/audit | Audit trail |

### Report Bug (prefix: `/api/v1/report-bug`)

| Method | Path | Description |
|--------|------|-------------|
| POST | / | Submit bug report (requires BUG_REPORT_EMAIL) |

## Structure

- `src/interfaces/http/` – Routes, controllers
- `src/usecases/` – Business logic (auth, user, document services)
- `src/infrastructure/` – DB, email, multer
- `src/middleware/` – Auth, error handler
- `prisma/` – Schema, migrations, seed
