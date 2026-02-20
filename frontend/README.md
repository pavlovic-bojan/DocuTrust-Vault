# Frontend – DocuTrust Vault SPA

React 18 + Vite + Tailwind CSS + TypeScript. i18n: en, es, fr, sr-lat, sr-cyr.

## Setup

1. Copy `.env.example` to `.env`
2. Set `VITE_API_URL` to backend URL (default: `http://localhost:4000`)

## Run

- Dev: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`
- Test: `npm run test`
- Test (watch): `npm run test:watch`
- Test (coverage): `npm run test:coverage`

## Structure

- `src/api/` – API clients (auth, users, documents, report-bug)
- `src/stores/` – Auth store (authStore)
- `src/pages/` – Pages (Login, ForgotPassword, Dashboard, Users, Documents, Profile, ReportBug)
- `src/layouts/` – MainLayout (header, nav, user menu)
- `src/components/` – UI components (drawer, button, input, badge, dropdown, ThemeToggle)
- `src/i18n/` – i18next locales and translateApiError

## Routes

| Path | Description |
|------|-------------|
| /login | Login page |
| /forgot-password | Forgot password |
| / | Dashboard (redirects USER to /documents) |
| /users | Users management (Admin only) |
| /documents | Document list, upload, download, send, delete |
| /profile | User profile |
| /report-bug | Bug report form |
