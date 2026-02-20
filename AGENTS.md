# DocuTrust Vault – Agent Instructions

## Mandatory Context

Before implementing or changing anything:

1. **Read `docs/`** – BRD, PRD, TDD, HLD, OpenAPI, UI_SPEC
2. **Read `.cursor/rules/`** – Project overview, workflow, backend, frontend, testing, docs

## Key Documents

| Document | When to use |
|----------|-------------|
| `docs/DocuTrust_Vault_BRD.md` | Business rules, roles, pages |
| `docs/DocuTrust_Vault_PRD.md` | Product requirements |
| `docs/DocuTrust_Vault_ TDD.md` | Data model, schema |
| `docs/DocuTrust_Vault_HLD.md` | Architecture |
| `docs/OpenAPI.yaml` | API contracts |
| `docs/UI_SPEC.md` | **UI layout, pages, components – how it should look** |

## API + Swagger + Tests Rule (OBVEZNO)

- Svako **kreiranje** ili **izmena** API endpointa zahteva **odmah**:
  1. Ažuriranje `docs/OpenAPI.yaml`
  2. Unit testovi (`backend/src/__tests__/unit/`)
  3. Integration testovi (`backend/src/__tests__/integration/`)
- Nijedna API promena bez Swagger i testova

## Stack

- **Backend**: Node.js, TypeScript, Express, Prisma, PostgreSQL
- **Frontend**: React, TypeScript, Tailwind CSS, **shadcn/ui**
- **Pages**: Login, Users (Admin), Documents

## UI = docs/UI_SPEC.md

- Application shell: header, sidebar, main content
- Users page: table, Add/Edit/Delete (Admin full CRUD)
- Documents page: list/table, upload, View/Download/Send/Delete
- Hash status badges, integrity badges
- Follow shadcn/ui component mapping in UI_SPEC
