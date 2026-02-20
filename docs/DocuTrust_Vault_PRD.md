# PRD – Product Requirements Document
## DocuTrust Vault

---

## 1. Product Overview

**DocuTrust Vault** is a secure, compliance-driven document management application designed to ensure document integrity, traceability, and legal admissibility.  
The product enables organizations to store documents in accordance with U.S. Federal regulations, track their full lifecycle, and clearly distinguish between document renaming and content modification.

---

## 2. Goals & Objectives

### Primary Goals
- Ensure legal-grade document storage and integrity
- Provide full auditability for every document
- Prevent unauthorized access through role-based permissions
- Support legal discovery and dispute resolution

### Business Objectives
- Reduce legal risk related to document handling
- Provide defensible audit trails for courts and regulators
- Enable secure document sharing with full traceability

---

## 3. User Roles

### 3.1 Admin
- Full control over users: create, edit, delete, view all
- Can view all documents (read-only)
- Can view complete audit metadata
- Cannot modify document content

### 3.2 User
- Can upload documents
- Can view only own documents
- Can send documents externally (Email / Viber)
- Cannot access other users’ documents

---

## 4. Functional Requirements

### 4.1 Document Upload
- Users must be able to upload PDF and supported document formats
- System must store:
  - Original file
  - Metadata
  - Cryptographic hash
- Upload timestamp and uploader identity must be recorded

---

### 4.2 Document Integrity Detection

#### Rename Only
- System must detect filename changes
- File content hash must remain unchanged
- Operation must be labeled as **Renamed Only**

#### Content Modification
- System must detect content changes
- New hash must be generated
- Editing tool (e.g. PDF editor) must be recorded
- Operation must be labeled as **Content Modified**

#### Missing or Removed Hash
- System must detect missing or forcibly removed hash
- System-generated hash must be applied
- Integrity status must be flagged

---

### 4.3 External Distribution
- Users must be able to send documents via:
  - Email
  - Viber
- System must log:
  - Channel
  - Recipient
  - Timestamp
  - Document version (hash)
  - Integrity status

---

### 4.4 User Management (Admin only)
- Admin must be able to create new users (email, password, name, role, preferred language)
- Admin must be able to edit existing users (name, email, role, status, preferred language)
- Admin must be able to delete users (logical deletion)
- User deletion must use logical deletion; physical deletion after retention period

---

### 4.5 Document Deletion

#### Logical Deletion
- User deletion must result in logical deletion only
- Document remains stored and immutable

#### Physical Deletion
- Allowed only after retention period expires
- Must comply with U.S. Federal regulations

---

## 5. Audit & Compliance

- System must maintain an immutable audit trail per document
- Audit trail must include:
  - Creation
  - Upload
  - Rename
  - Content modification
  - Hash changes
  - External sharing
  - Logical deletion
  - Physical deletion (if applicable)

---

## 6. Localization & Language Support

The application must support the following languages:
- English
- Spanish
- French
- Serbian (Latin)
- Serbian (Cyrillic)

Localization requirements:
- Full UI translation
- Unicode support
- Language selection per user

---

## 7. Non-Functional Requirements

### Security
- Role-based access control
- Secure document storage
- Immutable audit logs

### Performance
- Upload and retrieval operations must be performant at scale

### Reliability
- No data loss
- High availability

---

## 8. Success Metrics

- 100% of documents have complete audit records
- System can always distinguish rename vs content edit
- Zero unauthorized document access
- Compliance with U.S. Federal retention standards

---

## 9. Out of Scope

- Real-time document collaboration
- Document editing within the system
- OCR or content extraction

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|-----|-----------|
| Legal non-compliance | Strict retention policies and audit logs |
| Unauthorized access | Role-based permissions |
| Integrity disputes | Cryptographic hashing and version tracking |

---

## 11. Summary

DocuTrust Vault delivers a legally defensible document management platform with strong compliance, traceability, and auditability guarantees, suitable for organizations operating under strict regulatory and legal requirements.
