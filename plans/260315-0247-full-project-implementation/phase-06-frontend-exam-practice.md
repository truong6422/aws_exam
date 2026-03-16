---
spec_id: phase-06-frontend-exam-practice
version: "1.0"
status: pending
agents:
  - fullstack-developer
acceptance_criteria:
  - Exam setup → start session → answer questions → submit → view result flow works end-to-end
  - Practice setup → question-by-question with instant feedback works
  - Timer countdown in exam mode
  - API calls wired to real backend (no mocks)
  - Zustand exam store fully wired
  - All new components under 200 lines
---

# Phase 06 — Frontend: Exam & Practice Flows (API-wired)

**Priority:** High
**Depends on:** Phase 00 (UI Redesign complete), Phase 02 (Exam Engine API)
**Blocks:** Phase 09 (Integration Tests)

## Overview

Wire the exam and practice page stubs to the real backend API. The UI design comes from Phase 00 (P6 of the UI redesign plan). This phase is purely about API integration, state management, and business logic on the frontend.

## Key Insights

- UI components (sticky header/footer, question card, answer options) are built in Phase 00
- This phase adds: API calls, state wiring, timer logic, routing between steps
- Exam flow: `ExamSetupPage` → `ExamSessionPage` → `ExamResultPage`
- Practice flow: `PracticeSetupPage` → `PracticeSessionPage` (no result page — inline feedback)
- Zustand `examsStore` exists but is wired to nothing — needs real actions
- Timer: client-side countdown, sync with `expires_at` from server
- On tab close/refresh during exam: session persists on server; frontend resumes via session ID from localStorage

## Requirements

### API Client Functions (in `lib/api/`)

```typescript
// lib/api/exams.ts
startSession(params: StartSessionParams): Promise<ExamSession>
submitExam(sessionId, answers: AnswerPayload[]): Promise<ExamResult>
submitPracticeAnswer(sessionId, questionId, choiceIds): Promise<PracticeAnswerResult>
getSession(sessionId): Promise<ExamSession>
getSessionResult(sessionId): Promise<ExamResult>
```

### TypeScript Types (in `types/`)

```typescript
// types/exam.ts
type SessionMode = 'exam' | 'practice'
type SessionStatus = 'in_progress' | 'submitted' | 'expired'

interface StartSessionParams {
  mode: SessionMode
  question_count: number
  domain?: string        // domain slug
  tags?: string[]
}

interface ExamSession {
  id: string
  mode: SessionMode
  status: SessionStatus
  questions: Question[]  // without correct answers in exam mode
  expires_at: string | null
  question_count: number
}

interface Question {
  id: number
  stem: string
  question_type: 'single' | 'multiple'
  choices: Choice[]
  domain: string
}

interface Choice {
  id: number
  text: string
  order: number
  // is_correct NOT included in exam mode response
}

interface ExamResult {
  score_raw: number
  score_pct: number
  passed: boolean
  answers: AnsweredQuestion[]
}
```

### Zustand Store Updates (`stores/exam-store.ts`)

```typescript
interface ExamStore {
  session: ExamSession | null
  answers: Map<questionId, choiceId[]>   // user's current answers
  currentIndex: number                   // which question is showing
  timeRemaining: number | null           // seconds
  practiceResults: Map<questionId, PracticeAnswerResult>

  // Actions
  startSession(params): Promise<void>
  setAnswer(questionId, choiceIds): void
  submitExam(): Promise<ExamResult>
  submitPracticeAnswer(questionId, choiceIds): Promise<void>
  nextQuestion(): void
  prevQuestion(): void
  clearSession(): void
}
```

### Page Logic

**`ExamSetupPage`**
- Filter form: question count (10 / 25 / 65), domain, difficulty
- On submit → call `startSession()` → navigate to `/exam/{sessionId}`

**`ExamSessionPage`**
- On mount: load session from store or fetch via `getSession()`
- Resume guard: if session expired → redirect to `/dashboard`
- Timer: interval ticking down from `timeRemaining`; auto-submit on 0
- Navigation: prev/next question, jump-to-question sidebar panel
- Submit button: confirm modal → `submitExam()` → navigate to result

**`ExamResultPage`**
- Fetch result via `getSessionResult(sessionId)`
- Show: score badge (pass/fail), per-question breakdown, correct answers + explanations

**`PracticeSetupPage`**
- Same filter form as ExamSetup (no time limit option)

**`PracticeSessionPage`**
- One question at a time
- On answer: call `submitPracticeAnswer()` → show inline feedback (correct/wrong + explanation)
- Next question button after feedback shown
- No result page: practice ends when last question answered

## Architecture

```
apps/frontend/src/
├── lib/api/
│   └── exams.ts              # API call functions
├── types/
│   └── exam.ts               # TypeScript interfaces
├── stores/
│   └── exam-store.ts         # Expanded Zustand store
└── pages/
    ├── exam/
    │   ├── exam-setup-page.tsx
    │   ├── exam-session-page.tsx
    │   └── exam-result-page.tsx
    └── practice/
        ├── practice-setup-page.tsx
        └── practice-session-page.tsx
```

## Related Code Files

**Modify:**
- `src/stores/exam-store.ts` — wire real API calls
- `src/pages/exam/exam-setup-page.tsx`
- `src/pages/exam/exam-session-page.tsx`
- `src/pages/exam/exam-result-page.tsx`
- `src/pages/practice/practice-setup-page.tsx`
- `src/pages/practice/practice-session-page.tsx`

**Create:**
- `src/lib/api/exams.ts`
- `src/types/exam.ts`

## Implementation Steps

1. Define TypeScript types in `types/exam.ts`
2. Write `lib/api/exams.ts` with all API call functions (using existing axios/fetch client)
3. Expand `stores/exam-store.ts` with real actions
4. Implement `ExamSetupPage`: filter form → `startSession()` → navigate
5. Implement `ExamSessionPage`: timer, question navigation, submit
6. Implement `ExamResultPage`: fetch + display result
7. Implement `PracticeSetupPage`
8. Implement `PracticeSessionPage`: inline feedback loop
9. Handle edge cases: expired session, network error, empty question pool

## Success Criteria

- Full exam flow works against real backend
- Timer counts down; auto-submits on expiry
- Practice mode shows correct answer + explanation after each submission
- Session survives page refresh (resume via sessionId in URL)
- All pages handle loading/error states

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|-----------|
| Timer drift (client vs server) | 🟡 Medium | Use `expires_at` from server as source of truth |
| Exposing answers in exam mode | 🔴 High | Backend handles; frontend must not render `is_correct` in exam mode |
| Large question list re-renders | 🟡 Medium | Memoize question components, use index for navigation |
