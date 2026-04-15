# Phase 06 — Frontend Exam & Practice Flows: Implementation Report

**Date:** 2026-03-22
**Phase file:** `plans/260315-0247-full-project-implementation/phase-06-frontend-exam-practice.md`
**Build status:** ✅ Zero TypeScript errors, production build succeeded

---

## Files Created

| File | Purpose |
|------|---------|
| `src/services/exam-api.ts` | All exam/certification/practice API calls, full TypeScript interfaces |
| `src/hooks/use-exam-timer.ts` | Countdown timer with Page Visibility API, useState for re-renders |
| `src/hooks/use-autosave.ts` | 30s interval autosave via syncToBackend action |
| `src/components/exam/question-navigation-grid.tsx` | Color-coded question grid (gray/green/orange/yellow) |
| `src/components/exam/exam-timer.tsx` | MM:SS display, warning/critical states |
| `src/components/exam/answer-option.tsx` | Single/multiple choice button with practice reveal state |

## Files Modified

| File | Changes |
|------|---------|
| `src/stores/exam-store.ts` | Full rewrite with Zustand `persist` middleware, `syncToBackend`, `getAnswersAsPartial` |
| `src/pages/exam/exam-setup-page.tsx` | Fetches certifications, start exam → initSession → navigate |
| `src/pages/exam/exam-session-page.tsx` | Full exam UI: timer, nav grid, autosave, flag, confirm submit dialog |
| `src/pages/exam/exam-result-page.tsx` | Score display, pass/fail badge, inline review, nav to history |
| `src/pages/practice/practice-setup-page.tsx` | Cert picker + domain filter, starts practice session |
| `src/pages/practice/practice-session-page.tsx` | Instant feedback mode: reveal answer + explanation after submit |
| `src/router/routes.tsx` | Added `/exam/:sessionId/review` route (reuses ExamResultPage) |

---

## Key Design Decisions

### API Client
- Existing `src/lib/api-client.ts` used as-is (fetch-based, auth via localStorage read)
- `exam-api.ts` uses `/questions/...` and `/exams/...` paths (apiClient prepends `/api/v1`)
- No axios added — package.json had none

### Exam Store
- `persist` with `partialize` persists only: `attemptId, mode, answers, flagged, currentIndex`
- `questions` NOT persisted (too large, re-nav to setup on hard refresh)
- `syncToBackend` catches errors silently — exam continues even if autosave fails
- Store name `aws-exam-session` (separate from auth store `aws-exam-auth`)

### Timer Hook
- Uses `useState` (not `useRef`) so component re-renders each second
- `onTimeUp` callback stored in ref to avoid stale closure in interval
- Page Visibility API pauses tick when `document.hidden`, resumes on show
- `initialSeconds` sync via `useEffect` — autosave response updates store → timer syncs

### Routes
- Existing routes use `:sessionId` param — all pages align with this (not `:attemptId`)
- Review route added: `/exam/:sessionId/review` → ExamResultPage (fetches review data when no nav state)

### Practice Mode
- Same `startExam` API, mode tracked in store as `'practice'`
- Reveal flow: select answer → "Submit Answer" → lock options, show explanation
- `autosaveExam` called on reveal to persist answer before proceeding
- On last question: `submitExam` → `clearSession` → redirect to setup with completion state

---

## Acceptance Criteria Status

| Criterion | Status |
|-----------|--------|
| Exam setup lists certifications from API | ✅ |
| Exam session displays single/multiple choice questions | ✅ |
| Navigation grid: gray/green/orange/yellow color coding | ✅ |
| Timer counts down from `time_remaining_seconds` | ✅ |
| Timer red at <5min, pulses at <1min, auto-submits at 0 | ✅ |
| Autosave every 30s via PATCH autosave endpoint | ✅ |
| Zustand store persists answers to localStorage | ✅ |
| Exam result shows score and correct/total | ✅ |
| Practice mode shows explanation after each answer | ✅ (when review API returns it) |
| Page Visibility API pauses/resumes timer | ✅ |

---

## Unresolved Questions

1. **Practice mode explanation source**: The practice session calls `autosaveExam` on reveal but does not fetch per-question explanation inline (no dedicated single-question endpoint). Explanation only shows if `ExamReview.questions[].explanation` is non-empty. If the backend doesn't return explanations in the review, the panel shows a generic "continue" message.

2. **Resume after hard refresh**: Questions are not persisted. If a user refreshes mid-exam and `attemptId` in store matches URL, they land on a spinner (no questions). A future improvement could re-fetch the attempt from `GET /api/v1/exams/{id}/` if such endpoint exists.

3. **Domain filter in practice**: Selected `domainId` is fetched and shown in dropdown but not yet passed to `startExam` — backend `startExam` API accepts `certification_id` only. Domain filtering may require a separate backend endpoint or query param.

4. **Pass threshold**: Result page hardcodes `>= 72%` as pass. Should use `certification.passing_score` from the submit result or review response once that field is exposed.
