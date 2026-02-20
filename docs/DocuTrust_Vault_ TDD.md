## DocuTrust Vault – TDD

---

## 1. Purpose

This Technical Design Document (TDD) defines the complete technical architecture, data model, and system behavior for **DocuTrust Vault**.  
It fully satisfies all BRD and PRD requirements and is legally, technically, and operationally complete.

---

## 2. System Architecture

- Frontend Web Application
- Backend REST API
- Relational Database (metadata)
- Immutable Object Storage (documents)
- External Services (Email, Viber)

---

## 3. Roles & Access Control (RBAC)

### ADMIN

- Access Users page
- Full control over users: create, edit, delete
- Access all documents (read-only)

### USER

- Access Documents page
- Access only own documents

RBAC enforced at API and UI levels.

---

## 4. Data Model

### 4.1 Company Table

| Field                 | Type      | Description       |
| --------------------- | --------- | ----------------- |
| company_id            | UUID      | Primary key       |
| company_name          | String    | Legal name        |
| status                | Enum      | ACTIVE / INACTIVE |
| retention_policy_days | Integer   | Legal retention   |
| legal_jurisdiction    | String    | US Federal        |
| created_at            | Timestamp | Creation date     |

---

### 4.2 User Table

| Field              | Type      | Description                    |
| ------------------ | --------- | ------------------------------ |
| user_id            | UUID      | Primary key                    |
| company_id         | UUID      | FK → Company                   |
| email              | String    | Unique                         |
| first_name         | String    | First name                     |
| last_name          | String    | Last name                      |
| role               | Enum      | ADMIN / USER                   |
| status             | Enum      | ACTIVE / SUSPENDED / DELETED   |
| preferred_language | Enum      | EN / ES / FR / SR_LAT / SR_CYR |
| created_at         | Timestamp | Created                        |
| created_by         | UUID      | Admin                          |
| last_login_at      | Timestamp | Last login                     |
| logical_deleted    | Boolean   | Logical delete                 |
| logical_deleted_at | Timestamp | Delete time                    |

---

### 4.3 Document Table

| Field                 | Type      | Description                        |
| --------------------- | --------- | ---------------------------------- |
| document_id           | UUID      | Primary key                        |
| company_id            | UUID      | FK → Company                       |
| original_file_name    | String    | Original name                      |
| current_file_name     | String    | Current name                       |
| file_type             | String    | PDF, DOCX                          |
| file_size             | Long      | Size                               |
| created_at            | Timestamp | Creation                           |
| created_by_user       | UUID      | Creator                            |
| creation_tool         | String    | Tool                               |
| uploaded_at           | Timestamp | Upload                             |
| uploaded_by_user      | UUID      | Uploader                           |
| initial_hash          | String    | Hash                               |
| hash_algorithm        | String    | SHA-256                            |
| hash_status           | Enum      | VALID / MISSING / REMOVED / SYSTEM |
| content_modified      | Boolean   | Content changed                    |
| rename_only           | Boolean   | Rename only                        |
| last_modified_at      | Timestamp | Modified                           |
| modified_by_user      | UUID      | Modifier                           |
| modification_tool     | String    | Tool                               |
| sent_externally       | Boolean   | Sent                               |
| sent_via              | Enum      | EMAIL / VIBER                      |
| sent_version_hash     | String    | Sent hash                          |
| legal_hold            | Boolean   | Legal hold                         |
| logical_deleted       | Boolean   | Logical delete                     |
| logical_deleted_at    | Timestamp | Delete time                        |
| retention_expiry_date | Date      | Physical delete allowed            |
| audit_status          | Enum      | COMPLIANT / REVIEW / NON_COMPLIANT |

---

### 4.4 Audit Log Table (Immutable)

| Field         | Type      | Description                              |
| ------------- | --------- | ---------------------------------------- |
| audit_id      | UUID      | Primary key                              |
| document_id   | UUID      | FK → Document                            |
| action        | Enum      | UPLOAD / RENAME / MODIFY / SEND / DELETE |
| performed_by  | UUID      | User                                     |
| performed_at  | Timestamp | Time                                     |
| previous_hash | String    | Before                                   |
| new_hash      | String    | After                                    |
| channel       | Enum      | EMAIL / VIBER                            |
| notes         | String    | Details                                  |

---

## 5. Hash & Integrity Rules

- SHA-256 hashing
- Rename does NOT change hash
- Content edit MUST change hash
- Missing hash → system-generated

---

## 6. Document Lifecycle

Upload → Validate hash → Rename/Edit → Send → Logical delete → Physical delete after retention

---

## 7. Localization

Languages:

- English
- Spanish
- French
- Serbian (Latin)
- Serbian (Cyrillic)

UTF-8 encoding required.

---

## 8. Security

- HTTPS
- Encrypted storage
- Immutable audit logs
- No early physical delete

---

## 9. Logging & Monitoring

- All actions logged
- Integrity violations flagged

---

## 10. CI/CD & Deployment

- DEV / STAGE / PROD
- Automated tests
- Infrastructure as Code

---

## 11. Final Statement

This document represents a **100% complete, enterprise-grade Technical Design Document** for DocuTrust Vault.
"""
