# DocuTrust Vault – UI Specification

> Source: [BRD](DocuTrust_Vault_BRD.md), [PRD](DocuTrust_Vault_PRD.md). Stack: React + Tailwind + shadcn/ui.

---

## 1. Application Shell

### Layout
- **Header**: Logo, navigation, user menu (profile, language, logout)
- **Sidebar** (Admin): Users, Documents
- **Sidebar** (User): Documents only
- **Main content**: Page-specific content

### Navigation
- **Admin**: Users | Documents
- **User**: Documents only

---

## 2. Pages

### 2.1 Login Page
- Email + password form
- Submit button
- Error messages inline
- Optional: "Forgot password" link

### 2.2 Users Page (Admin only)
- **Table** with columns: Name, Email, Role, Status, Last Login, Created, Actions
- Filters: status, role
- Search by name/email
- **Actions**: Add user, Edit user, Delete user
- **Add user**: Form/drawer – email, password, first name, last name, role, preferred language
- **Edit user**: Form/drawer – first name, last name, email, role, status, preferred language
- **Delete user**: Confirm dialog (logical deletion)

### 2.3 Documents Page
- **Admin**: all documents in company
- **User**: own documents only

#### Document List (Table/Cards)
| Column / Field   | Description                    |
|------------------|--------------------------------|
| Name             | Current filename               |
| Original Name    | Original filename at upload    |
| Type             | PDF, DOCX                      |
| Size             | File size                      |
| Hash Status      | VALID, MISSING, REMOVED, SYSTEM|
| Content Modified | Yes/No badge                   |
| Rename Only      | Yes/No badge                   |
| Uploaded At      | Timestamp                      |
| Uploaded By      | User                           |
| Actions          | View, Download, Send, Delete   |

#### Actions per Document
- **View**: View metadata + audit trail
- **Download**: Download file
- **Send**: Modal/sheet – choose channel (Email/Viber), enter recipient
- **Delete**: Logical delete (confirm dialog)

#### Upload
- Drag & drop or file picker
- Supported: PDF, DOCX
- Progress indicator
- Success/error toast

---

## 3. Document Detail / Audit View
- Document metadata (all fields from TDD)
- **Audit trail** (immutable list): Action, Performed By, Timestamp, Previous Hash, New Hash, Channel, Notes

---

## 4. UI Components (shadcn/ui)

| Component     | Usage                                      |
|---------------|--------------------------------------------|
| Button        | Actions, submit                            |
| Input         | Forms, search                              |
| Table         | Users list, Documents list                 |
| Card          | Document cards (if card layout)            |
| Dialog        | Confirm delete, Send document              |
| Sheet/Drawer  | Document detail, Send form                 |
| Badge         | Hash status, Content modified, Rename only |
| Dropdown Menu | User menu, row actions                     |
| Toast         | Success, error messages                    |
| Form          | Login, Send document                       |

---

## 5. Hash Status & Integrity Badges

| Status   | Badge color   | Meaning                    |
|----------|---------------|----------------------------|
| VALID    | Green         | Hash present and valid     |
| MISSING  | Yellow/Orange | Hash was missing           |
| REMOVED  | Red           | Hash was removed           |
| SYSTEM   | Blue          | System-generated hash      |

| Flag            | Badge              |
|-----------------|--------------------|
| Content Modified| "Content Modified" |
| Rename Only     | "Renamed Only"     |

---

## 6. Localization
- Language switcher in header
- Languages: EN, ES, FR, SR_LAT, SR_CYR
- All UI strings via i18n keys

---

## 7. Responsive & Accessibility
- Mobile-friendly layout
- WCAG 2.1 AA
- Keyboard navigation
- Focus states

---

## 8. data-test Attributes (E2E)

| Element       | Attribute                          |
|---------------|------------------------------------|
| Login form    | `data-test="form-login"`           |
| Users table   | `data-test="table-users"`          |
| Add user btn  | `data-test="button-add-user"`      |
| Edit user btn | `data-test="button-edit-user"`     |
| Delete user btn | `data-test="button-delete-user"`  |
| Documents list| `data-test="list-documents"`       |
| Upload area   | `data-test="upload-area"`          |
| Send button   | `data-test="button-send-document"` |
| Delete button | `data-test="button-delete"`        |
