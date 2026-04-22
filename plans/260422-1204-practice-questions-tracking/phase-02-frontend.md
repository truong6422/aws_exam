---
phase: 02
title: Frontend — API Service, Practice Page, Admin Dashboard
status: pending
---

# Phase 02 — Frontend

## Tasks

### 1. Add `markQuestionViewed` to exam-api service

**File:** `apps/frontend/src/services/exam-api.ts`

Add to `practiceApi` object:

```typescript
markQuestionViewed: (questionId: number) =>
  apiClient.post<{ created: boolean; total_practice_views: number }>(
    '/questions/practice/viewed/',
    { question_id: questionId }
  ),
```

### 2. Call API on View Answer in practice session

**File:** `apps/frontend/src/pages/practice/practice-session-page.tsx`

`PracticeQuestionItem` receives `isAuthenticated` as a prop already. In `handleReveal()`, after `setRevealed(true)`, fire-and-forget the API call for authenticated users:

```typescript
const handleReveal = () => {
  if (selectedAnswers.length === 0) {
    useUiStore.getState().addToast({ type: 'warning', message: t('practice.select_answer_first') })
    return
  }
  setRevealed(true)
  setCommentsOpened(true)
  // Track practice view (fire-and-forget, non-blocking)
  if (isAuthenticated) {
    practiceApi.markQuestionViewed(question.id).catch(() => {})
  }
}
```

Note: `practiceApi` is already imported at the top of this file.

### 3. Update `DashboardStats` type

**File:** `apps/frontend/src/services/admin-api.ts`

Add field to `DashboardStats` interface:

```typescript
export interface DashboardStats {
  users: number
  certifications: number
  questions: number
  exam_sets: {
    total: number
    unlocked: number
    locked: number
  }
  total_time_seconds: number
  total_questions_done: number  // ← add this
}
```

### 4. Add stat card to admin dashboard

**File:** `apps/frontend/src/pages/admin/admin-dashboard-page.tsx`

Add to `statCards` array:

```typescript
{ label: t('admin.total_questions_done'), value: stats?.total_questions_done ?? 0 },
```

### 5. Add i18n keys

**File:** `apps/frontend/src/i18n/locales/en.json`

In the `admin` section, after `total_exam_time`:

```json
"total_questions_done": "Total Questions Done"
```

**File:** `apps/frontend/src/i18n/locales/vi.json`

In the `admin` section, after `total_exam_time`:

```json
"total_questions_done": "Tổng câu đã làm"
```

## Acceptance Criteria

- [ ] Guest clicks View Answer → no API call, no console error
- [ ] Logged-in user clicks View Answer → network tab shows `POST /questions/practice/viewed/` → 200
- [ ] Same question revealed again → API still returns 200, `created: false`
- [ ] Admin dashboard shows new "Total Questions Done" stat card with correct number
- [ ] Stat card increments after user completes practice questions
