---
spec_id: phase-06-frontend-exam-practice
version: "1.0"
status: completed
blockedBy:
  - phase-02-backend-exam-engine
agents:
  - fullstack-developer
acceptance_criteria:
  - "Exam setup page lists certifications from API and starts exam on button click"
  - "Exam session page displays questions with single/multiple choice answers"
  - "Question navigation grid shows color-coded status: gray=unanswered, green=answered, orange=flagged, yellow=answered+flagged"
  - "Exam timer counts down from server-provided time_remaining_seconds"
  - "Timer turns red at <5min, pulses at <1min, auto-submits at 0"
  - "Autosave fires every 30s via PATCH /api/v1/exams/{id}/autosave/"
  - "Zustand store persists answers to localStorage (survives refresh)"
  - "Exam result page shows score, correct/total, and domain breakdown"
  - "Practice mode shows explanation inline after each answer submission"
  - "Page Visibility API pauses/resumes timer on tab switch"
---

# Phase 06 — Frontend: Exam & Practice Flows

## Overview

- **Priority**: P0 (Core user-facing feature)
- **Depends on**: P2 (Backend exam endpoints must be live)
- **Blocks**: P9 (Integration Tests)
- **Description**: Wire exam and practice page stubs to real backend APIs. Implement Zustand exam store with localStorage persist, countdown timer with Page Visibility API, autosave every 30s, question navigation grid. This is Vite + React SPA with React Router v6 — NOT Next.js.

## Related Code Files

### Modify
- `apps/frontend/src/stores/exam-store.ts` — rewrite with persist middleware, answers Map, autosave action
- `apps/frontend/src/pages/exam/exam-setup-page.tsx` — certification picker + start button
- `apps/frontend/src/pages/exam/exam-session-page.tsx` — full exam UI with timer, navigation, answers
- `apps/frontend/src/pages/exam/exam-result-page.tsx` — score display + review link
- `apps/frontend/src/pages/practice/practice-setup-page.tsx` — cert + domain filter
- `apps/frontend/src/pages/practice/practice-session-page.tsx` — instant feedback mode

### Create
- `apps/frontend/src/services/exam-api.ts` — API client for exam endpoints
- `apps/frontend/src/services/api-client.ts` — shared axios/fetch wrapper with auth headers (if not exists)
- `apps/frontend/src/hooks/use-exam-timer.ts` — countdown + Page Visibility API
- `apps/frontend/src/hooks/use-autosave.ts` — 30s interval autosave
- `apps/frontend/src/components/exam/question-navigation-grid.tsx` — color-coded grid
- `apps/frontend/src/components/exam/exam-timer.tsx` — countdown display
- `apps/frontend/src/components/exam/answer-option.tsx` — single/multiple choice button

### Delete
- None (update stubs in place)

## Implementation Steps

### Step 1: Create API Client

Create `services/api-client.ts`:
- Export a configured fetch/axios instance
- Read access token from `useAuthStore.getState().token`
- Set `Authorization: Bearer {token}` header on all requests
- Set `Content-Type: application/json`
- Base URL from env var `VITE_API_URL` (default: `http://localhost:8000`)
- Handle 401 responses: attempt token refresh, if fails → logout + redirect to /login

### Step 2: Create Exam API Service

Create `services/exam-api.ts`:

```typescript
export const examApi = {
  getCertifications: () => GET('/api/v1/questions/certifications/'),
  getDomains: (certId: number) => GET(`/api/v1/questions/certifications/${certId}/domains/`),
  startExam: (certificationId: number) => POST('/api/v1/exams/start/', { certification_id: certificationId }),
  autosaveExam: (attemptId: number, answers: PartialAnswer[]) => PATCH(`/api/v1/exams/${attemptId}/autosave/`, answers),
  submitExam: (attemptId: number, answers: PartialAnswer[]) => POST(`/api/v1/exams/${attemptId}/submit/`, answers),
  getExamReview: (attemptId: number) => GET(`/api/v1/exams/${attemptId}/review/`),
  getExamList: (page?: number) => GET(`/api/v1/exams/?page=${page || 1}`),
}
```

Define TypeScript interfaces for all API responses matching backend serializers.

### Step 3: Rewrite Exam Store

Rewrite `stores/exam-store.ts` with Zustand `persist` middleware:

**State:**
- `attemptId: number | null`
- `mode: 'exam' | 'practice'`
- `questions: Question[]`
- `answers: Record<number, number[]>` — `{questionId: [selectedAnswerIds]}`
- `flagged: Set<number>` (serialize as array in persist)
- `currentIndex: number`
- `timeRemaining: number`
- `isSaving: boolean`

**Actions:**
- `initSession(attemptId, questions, timeRemaining, mode)` — set all fields
- `updateAnswer(questionId, answerIds)` — update answers map
- `toggleFlag(questionId)` — add/remove from flagged set
- `goToQuestion(index)` — set currentIndex
- `setTimeRemaining(seconds)` — update countdown
- `syncToBackend()` — call PATCH autosave, set isSaving
- `clearSession()` — reset all fields, clear localStorage

**Persist config:**
- `name: 'aws-exam-session'`
- `partialize`: persist `attemptId, answers, flagged, currentIndex, mode` (NOT questions — re-fetch on reload)
- Custom storage serializer for Set → Array conversion

### Step 4: Create Timer Hook

Create `hooks/use-exam-timer.ts`:

```typescript
function useExamTimer(initialSeconds: number, onTimeUp: () => void) {
  // State: time (seconds), isVisible (Page Visibility)
  // useEffect: decrement every 1s when visible
  // useEffect: Page Visibility API listener
  // useEffect: call onTimeUp when time hits 0
  // Return: { minutes, seconds, isWarning, isCritical }
}
```

- `isWarning`: time < 300 (5min) → red text
- `isCritical`: time < 60 (1min) → pulse animation
- Page Visibility: stop counting when `document.hidden`, resume on visible
- On resume after hidden: re-sync time from store (which gets updated by autosave response)

### Step 5: Create Autosave Hook

Create `hooks/use-autosave.ts`:

```typescript
function useAutosave(attemptId: number | null, answers: Record<number, number[]>) {
  // useEffect with 30s setInterval
  // On each tick: call examApi.autosaveExam()
  // Update timeRemaining from response
  // Show saving indicator via isSaving state
  // Cleanup interval on unmount or session end
  // Return: { isSaving, lastSavedAt }
}
```

### Step 6: Create Question Navigation Grid

Create `components/exam/question-navigation-grid.tsx`:

Props: `{ totalQuestions, answers, flagged, currentIndex, onSelectQuestion }`

Color logic per question number button:
- No answer + not flagged → `bg-gray-200` (unanswered)
- Has answer + not flagged → `bg-green-400` (answered)
- No answer + flagged → `bg-orange-400` (flagged for review)
- Has answer + flagged → `bg-yellow-400` (answered + flagged)
- Current question → `ring-2 ring-blue-600 ring-offset-1`

Layout: `grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-2`
Add legend below grid showing color meanings.

### Step 7: Create Exam Timer Component

Create `components/exam/exam-timer.tsx`:

- Display `MM:SS` format with monospace font
- Normal: `text-gray-800`
- Warning (<5min): `text-red-600 font-bold`
- Critical (<1min): `text-red-600 animate-pulse font-bold`

### Step 8: Create Answer Option Component

Create `components/exam/answer-option.tsx`:

Props: `{ answer, isSelected, questionType, onSelect }`

- Single choice: radio button style — clicking deselects other answers
- Multiple choice: checkbox style — toggle individual answers
- Selected state: `bg-blue-50 border-blue-500 ring-1 ring-blue-500`
- Default state: `bg-white border-gray-300 hover:bg-gray-50`

### Step 9: Wire Exam Setup Page

Update `pages/exam/exam-setup-page.tsx`:
1. On mount: fetch certifications via `examApi.getCertifications()`
2. Display certification cards with name, code, time_limit, total_questions, passing_score
3. "Start Exam" button per cert → calls `examApi.startExam(certId)`
4. On success: init exam store → navigate to `/exam/{attemptId}`

### Step 10: Wire Exam Session Page

Update `pages/exam/exam-session-page.tsx`:
1. On mount: check exam store for existing session (localStorage recovery)
2. If no session: redirect to `/exam/setup`
3. Layout: sidebar (navigation grid + timer) + main (question + answers)
4. Integrate: `useExamTimer`, `useAutosave`, exam store actions
5. Navigation: Prev/Next buttons + grid click
6. Flag button: toggle flag on current question
7. Submit button: confirmation dialog → call `examApi.submitExam()` → navigate to result
8. Auto-submit on timer expiry

### Step 11: Wire Exam Result Page

Update `pages/exam/exam-result-page.tsx`:
1. Fetch result from URL param `:sessionId` — or read from navigation state
2. Display: score percentage (large), correct/total, pass/fail badge
3. "Review Answers" button → navigate to review view (or expand inline)
4. "Back to Dashboard" button
5. Clear exam store session

### Step 12: Wire Practice Pages

Update `pages/practice/practice-setup-page.tsx`:
- Certification picker + domain filter (optional)
- "Start Practice" button → start exam with mode='practice' (use same API but track mode in store)

Update `pages/practice/practice-session-page.tsx`:
- Same question display as exam mode
- After answering: immediately show explanation + correct answer inline
- Green/red highlight on answer options
- "Next Question" button to proceed
- No timer, no autosave, no navigation grid

## Security Considerations

- **Token in API requests**: Use auth store token. Never expose in URL params.
- **localStorage exam data**: Contains question IDs and user answers. Acceptable risk — user's own data.
- **No is_correct in exam store**: Backend ExamSerializer excludes it. Frontend has no way to cheat via localStorage.
- **Auto-submit on expiry**: Prevents users from continuing past time limit (client-side enforcement + backend validation).

## Acceptance Criteria

- Exam setup page lists certifications from API and starts exam on button click
- Exam session page displays questions with single/multiple choice answers
- Question navigation grid shows color-coded status: gray=unanswered, green=answered, orange=flagged, yellow=answered+flagged
- Exam timer counts down from server-provided time_remaining_seconds
- Timer turns red at <5min, pulses at <1min, auto-submits at 0
- Autosave fires every 30s via PATCH /api/v1/exams/{id}/autosave/
- Zustand store persists answers to localStorage (survives refresh)
- Exam result page shows score, correct/total, and domain breakdown
- Practice mode shows explanation inline after each answer submission
- Page Visibility API pauses/resumes timer on tab switch
