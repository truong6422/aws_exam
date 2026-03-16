---
spec_id: phase-08-frontend-admin
version: "1.0"
status: pending
agents:
  - fullstack-developer
acceptance_criteria:
  - Admin dashboard shows real user/question/session counts
  - Question list with search/filter, inline edit link
  - User list with pagination
  - Import page: file upload → job status polling
  - All pages admin-guarded (AdminRoute)
  - API layer typed and tested
---

# Phase 08 — Frontend: Admin Panel (API-wired)

**Priority:** Medium
**Depends on:** Phase 00 (UI Redesign), Phase 01 (Questions API), Phase 05 (Import API)
**Blocks:** Phase 09 (Integration Tests)

## Overview

Wire the four admin page stubs to real backend APIs. Admin panel covers: overview stats, question management, user management, and bulk import. All guarded by `AdminRoute`.

## Key Insights

- Admin pages already exist as stubs with `AdminRoute` guard — just needs wiring
- Admin overview: aggregate counts (users, questions, sessions, imports)
- Question list: needs search + domain/difficulty filter, pagination, link to edit
- User list: paginated, searchable, show join date + last active
- Import page: file picker → upload → poll `ImportJob` status → show error log if any
- No inline question editor needed (use Django Admin for edits — YAGNI)

## Requirements

### API Client Functions (`lib/api/admin.ts`)

```typescript
// Stats
getAdminStats(): Promise<AdminStats>

// Questions
listQuestions(params: QuestionFilter): Promise<PaginatedResponse<AdminQuestion>>

// Users
listUsers(params: UserFilter): Promise<PaginatedResponse<AdminUser>>

// Imports
uploadImport(file: File): Promise<ImportJob>
getImportJob(id: string): Promise<ImportJob>
listImportJobs(): Promise<ImportJob[]>
```

### TypeScript Types (`types/admin.ts`)

```typescript
interface AdminStats {
  total_users: number
  total_questions: number
  total_sessions: number
  total_imports: number
}

interface AdminQuestion {
  id: number
  stem: string           // truncated to 80 chars for list
  domain: string
  difficulty: string
  question_type: string
  is_active: boolean
  created_at: string
}

interface AdminUser {
  id: number
  email: string
  display_name: string
  is_staff: boolean
  date_joined: string
  total_sessions: number
}

interface ImportJob {
  id: string
  file_format: 'csv' | 'json'
  status: 'pending' | 'processing' | 'done' | 'failed'
  rows_total: number | null
  rows_processed: number
  rows_failed: number
  error_log: Array<{ row: number; error_message: string }>
  created_at: string
  completed_at: string | null
}
```

### Page Logic

**`AdminDashboardPage`**
- Fetch `getAdminStats()` → render 4 stat cards
- Recent imports mini-list (last 3 jobs)
- Quick links: "Add questions via import", "Manage users"

**`AdminQuestionsPage`**
- Filter bar: search (stem text), domain select, difficulty select, type select
- Paginated table: stem (truncated), domain, difficulty, type, active toggle
- "Active" toggle calls `PATCH /api/questions/{id}/` with `{is_active: !current}`
- No inline edit — link opens Django Admin `/admin/questions/question/{id}/change/`

**`AdminUsersPage`**
- Search by email
- Paginated table: email, display name, joined date, sessions count, staff badge
- No user edit on frontend — YAGNI

**`AdminImportPage`**
- File picker (CSV or JSON, validate client-side mime/extension)
- Upload button → POST to `/api/imports/` → get job ID
- Poll `getImportJob(id)` every 2s while status is `pending` or `processing`
- Progress bar: `rows_processed / rows_total`
- On `done`: show success summary
- On `failed`: show `error_log` table (row number + error message)
- Past imports list: last 10 jobs with status badges

## Architecture

```
apps/frontend/src/
├── lib/api/
│   └── admin.ts
├── types/
│   └── admin.ts
└── pages/admin/
    ├── admin-dashboard-page.tsx
    ├── admin-questions-page.tsx
    ├── admin-users-page.tsx
    └── admin-import-page.tsx
```

## Related Code Files

**Modify:**
- `src/pages/admin/admin-dashboard-page.tsx`
- `src/pages/admin/admin-questions-page.tsx`
- `src/pages/admin/admin-users-page.tsx`
- `src/pages/admin/admin-import-page.tsx`

**Create:**
- `src/lib/api/admin.ts`
- `src/types/admin.ts`

## Implementation Steps

1. Define types in `types/admin.ts`
2. Write `lib/api/admin.ts` with all API functions
3. Implement `AdminDashboardPage`: stats + recent imports
4. Implement `AdminQuestionsPage`: filter bar + paginated table + active toggle
5. Implement `AdminUsersPage`: search + paginated table
6. Implement `AdminImportPage`:
   - File picker with validation
   - Upload → create job
   - Polling loop with `useEffect` + `setInterval`
   - Progress bar + error log table
   - Past jobs list
7. Ensure all pages respect `AdminRoute` guard (already wired in router)

## Success Criteria

- Admin stats load from real API
- Question list filters work (domain, difficulty, search)
- File upload → polling shows progress → success/error display
- Past import jobs listed with correct status badges
- No TypeScript errors, no console errors

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|-----------|
| Polling memory leak | 🟡 Medium | Clear interval in `useEffect` cleanup |
| Large error log table | 🟢 Low | Paginate or limit display to first 50 rows |
| Admin API blocked for non-staff | 🟢 Low | `AdminRoute` guard + backend `IsAdminUser` |
