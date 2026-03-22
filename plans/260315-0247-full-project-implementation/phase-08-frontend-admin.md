---
spec_id: phase-08-frontend-admin
version: "1.0"
status: completed
blockedBy:
  - phase-05-backend-import
agents:
  - fullstack-developer
acceptance_criteria:
  - "Admin pages only accessible to users with is_staff=true"
  - "Import page accepts JSON file upload and displays validation feedback"
  - "Successful import shows count of imported questions"
  - "Failed import shows specific error messages from backend"
  - "Questions page lists questions with certification/domain filter"
  - "Admin dashboard shows stats: total questions, total users, total attempts"
  - "Non-admin users redirected away from /admin/* routes"
---

# Phase 08 — Frontend: Admin Panel

## Overview

- **Priority**: P2 (Content management — staff only)
- **Depends on**: P5 (Backend import endpoint)
- **Blocks**: P9 (Integration Tests)
- **Description**: Wire admin page stubs to import and question management APIs. Admin-only access via existing AdminRoute guard.

## Related Code Files

### Modify
- `apps/frontend/src/pages/admin/admin-import-page.tsx` — JSON upload + validation UI
- `apps/frontend/src/pages/admin/admin-questions-page.tsx` — question list with filters
- `apps/frontend/src/pages/admin/admin-dashboard-page.tsx` — admin stats overview

### Create
- `apps/frontend/src/services/admin-api.ts` — API client for admin endpoints
- `apps/frontend/src/components/admin/import-dropzone.tsx` — file upload component
- `apps/frontend/src/components/admin/import-result-panel.tsx` — success/error display
- `apps/frontend/src/components/admin/question-filters.tsx` — cert/domain filter bar

### Delete
- None

## Implementation Steps

### Step 1: Create Admin API Service

Create `services/admin-api.ts`:

```typescript
export const adminApi = {
  importQuestions: (data: ImportPayload) =>
    POST('/api/v1/imports/questions/', data),
  getQuestions: (params: QuestionFilterParams) =>
    GET('/api/v1/questions/admin/', params),  // admin-only endpoint if exists
  getAdminStats: () =>
    GET('/api/v1/analytics/admin-stats/'),    // or compute from existing endpoints
}
```

Note: Some admin endpoints may need to be added to backend. If `/api/v1/questions/admin/` doesn't exist, use the public certifications + domains endpoints and fetch questions via admin-specific view.

**Fallback approach for admin stats**: If no dedicated admin stats endpoint, compute from:
- Total questions: fetch from a count endpoint or use Django admin API
- Total users: may need a simple `GET /api/v1/auth/admin/stats/` endpoint (staff-only)
- Add minimal staff-only stats endpoint in backend if needed

### Step 2: Create Import Dropzone Component

Create `components/admin/import-dropzone.tsx`:

Props: `{ onFileSelected: (data: object) => void, isLoading: boolean }`

- File input accepting `.json` files only
- Drag-and-drop zone with visual feedback
- On file select: read with `FileReader`, parse JSON, validate basic structure client-side
- Display file name + size after selection
- "Upload & Import" button triggers actual API call
- Client-side pre-validation: check JSON is valid, has `certification_code`, `domain_name`, `questions` array

### Step 3: Create Import Result Panel

Create `components/admin/import-result-panel.tsx`:

Props: `{ result: ImportResult | null, errors: string[] }`

Two states:
1. **Success**: Green banner — "Successfully imported {N} questions to {certification} / {domain}"
2. **Error**: Red banner — list of error messages from backend validation

### Step 4: Wire Import Page

Update `pages/admin/admin-import-page.tsx`:

1. Import Dropzone at top
2. On file select: store parsed JSON in state
3. Show JSON preview (collapsible): certification_code, domain_name, question count
4. "Import" button: call `adminApi.importQuestions(data)`
5. Show loading spinner during import
6. On success: show ImportResultPanel with success message
7. On error: show ImportResultPanel with error list
8. "Import Another" button to reset form

### Step 5: Create Question Filters Component

Create `components/admin/question-filters.tsx`:

Props: `{ onFilterChange: (filters) => void }`

- Certification dropdown (fetch from certifications API)
- Domain dropdown (filtered by selected certification)
- Search text input (filters by question text — server-side or client-side)
- "Clear Filters" button

### Step 6: Wire Questions Page

Update `pages/admin/admin-questions-page.tsx`:

1. QuestionFilters bar at top
2. Fetch questions: either from a paginated admin endpoint or by loading all questions per domain
3. Table layout:
   - Columns: ID, Question text (truncated), Domain, Type, Answer count, Source
   - Click row to expand → show full text, answers, explanation
4. Pagination matching backend
5. "Import Questions" CTA button → navigates to `/admin/import`

### Step 7: Wire Admin Dashboard Page

Update `pages/admin/admin-dashboard-page.tsx`:

1. Stats cards row:
   - Total Questions (count from questions endpoint)
   - Total Certifications (count from certifications endpoint)
   - Total Domains (sum across certifications)
2. Quick actions:
   - "Import Questions" → `/admin/import`
   - "View Questions" → `/admin/questions`
   - "Manage Users" → `/admin/users`
3. Recent imports list (if backend tracks import history — otherwise skip)

### Step 8: Verify AdminRoute Guard

Existing `AdminRoute` component in `router/admin-route.tsx`:
- Should check `useAuthStore().user?.is_staff`
- If not staff: redirect to `/dashboard` with toast notification
- Verify this guard works correctly with the auth store

## Security Considerations

- **AdminRoute guard**: Frontend guard is UX only — backend enforces `IsAdminUser` permission.
- **File upload safety**: Only accept `.json` files. Parse with `JSON.parse()` — never `eval()`.
- **Client-side preview**: Showing JSON preview is safe — it's the admin's own uploaded data.
- **No sensitive data exposure**: Admin sees question text + answers + is_correct (expected for staff).

## Acceptance Criteria

- Admin pages only accessible to users with is_staff=true
- Import page accepts JSON file upload and displays validation feedback
- Successful import shows count of imported questions
- Failed import shows specific error messages from backend
- Questions page lists questions with certification/domain filter
- Admin dashboard shows stats: total questions, total users, total attempts
- Non-admin users redirected away from /admin/* routes
