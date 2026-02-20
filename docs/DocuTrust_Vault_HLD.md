# DocuTrust Vault
## High-Level Design (HLD)

---

## 1. Purpose of This Document

This document describes the **High-Level Design (HLD)** of the DocuTrust Vault platform. The purpose is to:

- Define the system architecture of the document management system
- Describe how the system ensures integrity, compliance, and auditability
- Set clear domain and module boundaries
- Enable future evolution without redesign

This document is:

- Above TDD
- Below PRD
- Implementation-agnostic

---

## 2. System Overview

DocuTrust Vault is a **secure, compliance-driven document management system** that enables organizations to:

- Store and preserve digital documents in compliance with U.S. Federal regulations
- Track document lifecycle and integrity through cryptographic hashing
- Distinguish between document renaming and content modification
- Distribute documents externally (Email, Viber) with full traceability
- Maintain immutable audit trails for legal discovery and dispute resolution

The system is designed as a **full-stack application** with web UI and REST API, suitable for organizations operating under strict regulatory and legal requirements.

---

## 3. Architectural Principles

- Compliance-first (U.S. Federal regulations)
- Integrity-by-design (cryptographic hashing)
- Auditability-first (immutable audit logs)
- Role-based access control
- Stateless API layer
- Cloud-native design
- Vendor-agnostic / No vendor lock-in
- Domain-driven boundaries
- Testability-first

---

## 4. System Context

### 4.1 External Actors & Systems

- **Admin Users**  
  Full control over users (create, edit, delete), view all documents (read-only), access Users page

- **Regular Users**  
  Upload documents, view own documents, send externally (Email / Viber)

- **Email Service**  
  Outbound document distribution channel

- **Viber Service**  
  Outbound document distribution channel

- **Monitoring / Analytics Systems**  
  Consume audit events, integrity violations, usage metrics

---

## 5. High-Level Architecture

### 5.1 Architectural Style

- Modular Monolith (domain-based)
- Event-driven internally (audit events)
- Stateless API layer
- Cloud-native deployment

### 5.2 Logical Architecture

System structure:

```
DocuTrust Vault
├── Web Application (Frontend)
│   ├── Users Page (Admin only)
│   └── Documents Page (Admin: all / User: own)
├── REST API Gateway
│   ├── Auth Domain
│   ├── User Domain
│   ├── Document Domain
│   └── Audit Domain
│       └── Internal Event Bus (audit events)
├── PostgreSQL (metadata, users, audit logs)
└── Object Storage (document files, immutable)
```

---

## 6. Core Domains & Responsibilities

### 6.1 Auth Domain

- User authentication (login, session)
- JWT or session-based auth
- Role resolution (ADMIN / USER)

### 6.2 User Domain

- User lifecycle: create, edit, suspend, logical delete
- Company association
- Preferred language (EN, ES, FR, SR_LAT, SR_CYR)
- Admin-only: full CRUD over users

### 6.3 Document Domain

- Document upload and storage
- Hash generation and validation (SHA-256)
- Rename vs content-modification detection
- External distribution (Email, Viber)
- Logical deletion / retention enforcement
- Integrity status tracking

### 6.4 Audit Domain

- Immutable audit trail per document
- Captures: UPLOAD, RENAME, MODIFY, SEND, DELETE
- Previous/new hash tracking
- Channel and recipient logging

---

## 7. Multi-Tenancy Architecture

### 7.1 Tenant Model

- Company-based multi-tenancy
- Company ID propagated through:
  - Service layer
  - Persistence layer
  - Audit logs

### 7.2 Tenant Isolation

- Logical isolation in shared DB
- Mandatory company_id in all entities
- Query-level enforcement (users see only own company data)
- Company-specific retention policies

---

## 8. Data Architecture

### 8.1 Database Strategy

- Single relational DB (PostgreSQL) for metadata
- Immutable object storage (S3-compatible) for document files
- Strong indexing on company_id, user_id, document_id
- Audit log table is append-only (immutable)

### 8.2 Consistency Model

- ACID transactions for metadata
- Optimistic locking where applicable
- Audit events written after commit
- No early physical deletion (retention enforced)

---

## 9. Integration Architecture

### 9.1 API Strategy

- RESTful API, OpenAPI-first
- Versioned endpoints (v1, v2…)
- Backward compatibility
- JSON payloads

**MANDATORY – Swagger / OpenAPI sync**

- Svako **kreiranje** novog API endpointa mora biti dokumentovano u `docs/OpenAPI.yaml`
- Svaka **izmena** postojećeg endpointa (putanja, metode, request/response schemas) mora biti ažurirana u `docs/OpenAPI.yaml`
- `docs/OpenAPI.yaml` je izvor istine za API ugovor; Swagger UI služi specifikaciju sa `/api-docs`

### 9.2 External Distribution

- Email: SMTP or provider API integration
- Viber: Viber Business API
- All outbound sends logged (recipient, channel, timestamp, document hash)

---

## 10. Document Integrity Architecture

### 10.1 Hash Rules

- SHA-256 for all document hashes
- Rename only: hash unchanged, operation labeled as RENAME
- Content modified: new hash generated, operation labeled as MODIFY
- Missing/removed hash: system generates hash, integrity flagged

### 10.2 Lifecycle

```
Upload → Validate Hash → [Rename | Edit] → Send Externally → Logical Delete → Physical Delete (after retention)
```

---

## 11. Deployment Architecture

### 11.1 Runtime Environment

- Containerized application
- Kubernetes or Docker Compose
- Stateless API pods
- Externalized configuration (config maps / secrets)
- PostgreSQL as managed or self-hosted
- Object storage (S3, MinIO, or cloud provider)

### 11.2 Scalability

- Horizontal scaling of API pods
- Vertical scaling + read replicas for DB
- Object storage scales independently

---

## 12. Security Architecture

### 12.1 Authentication & Authorization

- User authentication (email + password or SSO)
- Role-based authorization: ADMIN, USER
- ADMIN: Users page (full CRUD) + all documents (read-only)
- USER: Documents page + own documents only

### 12.2 Security Controls

- TLS 1.2+ everywhere
- Encrypted document storage
- Input validation / sanitization
- Immutable audit logs
- Logical deletion only (no early physical delete)

---

## 13. Reliability & Fault Tolerance

### 13.1 Failure Handling

- Retry policies for external services (Email, Viber)
- Graceful degradation of API
- No partial document uploads

### 13.2 Resilience Patterns

- Circuit breakers for external integrations
- Timeout policies
- Retries with backoff for distribution channels

---

## 14. Observability

### 14.1 Logging

- Structured JSON logs
- Correlation IDs
- User-aware logging (no sensitive data)

### 14.2 Metrics

- documents_uploaded_total
- documents_sent_external_total
- integrity_violations_total
- audit_events_total

### 14.3 Monitoring

- Liveness & readiness probes
- Integrity violation alerts
- Retention expiry alerts

---

## 15. Localization Architecture

- Supported languages: EN, ES, FR, SR_LAT, SR_CYR
- Per-user language preference
- Full UI translation
- UTF-8 encoding required

---

## 16. Evolution & Scalability Path

### 16.1 Future Extensions

- Additional distribution channels
- Advanced retention policies
- Legal hold enhancements

### 16.2 Non-Goals

- Real-time document collaboration
- In-system document editing
- OCR or content extraction

---

## 17. Summary

This HLD defines:

- Compliance-first document management architecture
- Integrity-by-design with cryptographic hashing
- Immutable audit trails for legal defensibility
- Role-based access control (Admin / User)
- External distribution (Email, Viber) with full traceability
- Multi-tenant, company-based isolation

The document is ready for:

- Architectural review
- Technical pitch
- Production implementation
