# BRD – Document Integrity & Compliance Management System

## Application Name
**DocuTrust Vault**

## 1. Purpose
DocuTrust Vault is a secure document management system designed to store, track, and preserve digital documents in compliance with U.S. Federal regulations, ensuring auditability, integrity, and legal admissibility.

## 2. User Roles & Access Control

### Admin
- Access to Users page
- Access to Documents page
- Can view all documents and users
- Full control over users: create, edit, delete, view all

### User
- Access to Documents page only
- Can view and manage only own documents

## 3. Application Pages

### Users Page (Admin only)
- View all users and metadata
- Create new users
- Edit existing users (name, email, role, status, preferred language)
- Delete users (logical deletion)

### Documents Page
- Admin: view all documents
- User: view only own documents

## 4. Document Upload & Storage
- Users upload documents (PDF and supported formats)
- System stores original file and metadata
- System generates or validates cryptographic hash

## 5. Document Integrity & Modification Detection

### Rename Only
- Filename changes
- Content unchanged
- Hash unchanged

### Content Edited
- Content modified
- New hash generated
- Editing tool recorded

### Hash Missing or Removed
- System detects missing hash
- System generates internal hash
- Integrity flagged

## 6. External Distribution
- Supported channels: Email, Viber
- System logs recipient, timestamp, channel, and document hash

## 7. Legal Compliance & Retention
- Logical deletion only on user delete
- Physical deletion after retention period
- Full audit trail maintained

## 8. Audit & Traceability
- Complete lifecycle tracking per document
- System must always distinguish rename vs edit

## 9. Localization
Supported languages:
- English
- Spanish
- French
- Serbian (Latin)
- Serbian (Cyrillic)

## 10. Non-Functional Requirements
- Secure storage
- Immutable audit logs
- Role-based access control

## 11. Success Criteria
- Full document lifecycle traceability
- Legal compliance guaranteed
- Clear differentiation between rename and edit
