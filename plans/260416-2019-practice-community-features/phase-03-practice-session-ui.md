---
phase: "03"
title: Practice Session UI — Free Navigation, Bookmark, Component Integration
status: pending
---

# Phase 03 — Practice Session UI: Free Navigation + Component Integration

## Acceptance Criteria

- [ ] `practice-session-page.tsx` renders `CommentSection` below explanation panel (only when `isRevealed=true`)
- [ ] Bookmark button renders in question card header; toggles visually (optimistic); persisted via API
- [ ] "Report wrong answer" button renders below explanation panel; opens `AnswerReportModal`
- [ ] Free navigation question grid appears in practice session (matches exam mode behavior)
- [ ] Grid cell shows filled circle when question answered; star icon when bookmarked
- [ ] Clicking a grid cell navigates to that question (resets `revealed` state)
- [ ] Practice setup page has "Bookmarked Only" checkbox; when checked, filters questions to bookmarked IDs only
- [ ] `exam-store.ts` has `bookmarked: number[]` state + `toggleBookmarkLocal` action (client-side sync)
- [ ] Bookmarks loaded from `GET /api/v1/questions/bookmarks/` when session initializes
- [ ] All existing practice mode behavior unchanged

## File Ownership

```
apps/frontend/src/pages/practice/practice-session-page.tsx  # MODIFY: add CommentSection, BookmarkButton, ReportModal, free nav grid
apps/frontend/src/pages/practice/practice-setup-page.tsx    # MODIFY: add bookmarked-only checkbox filter
apps/frontend/src/stores/exam-store.ts                      # MODIFY: add bookmarked[], toggleBookmarkLocal, loadBookmarks
apps/frontend/src/services/exam-api.ts                      # MODIFY: add practiceApi (already done in Phase 02)
```

## Implementation Steps

### Step 1 — Extend `exam-store.ts`

Add `bookmarked` to state and actions:

```typescript
// In ExamState interface — add:
bookmarked: number[]

// In ExamActions interface — add:
toggleBookmarkLocal: (questionId: number) => void
loadBookmarks: () => Promise<void>

// In INITIAL_STATE — add:
bookmarked: []

// In store implementation — add:
toggleBookmarkLocal: (questionId) =>
  set((s) => ({
    bookmarked: s.bookmarked.includes(questionId)
      ? s.bookmarked.filter((id) => id !== questionId)
      : [...s.bookmarked, questionId],
  })),

loadBookmarks: async () => {
  try {
    const result = await practiceApi.getBookmarks()
    set({ bookmarked: result.question_ids })
  } catch {
    // Non-blocking — proceed without bookmarks
  }
},
```

In `partialize`, add `bookmarked: state.bookmarked` so bookmarks persist in localStorage.

Add import at top: `import { practiceApi } from '@/services/exam-api'`

### Step 2 — Practice Session Page: Question Navigation Grid

Add inline question nav grid between progress bar and question card.
Only renders in practice mode (check `mode === 'practice'` from store).

```tsx
// In practice-session-page.tsx — add grid below progress bar:

const { bookmarked, toggleBookmarkLocal, mode } = useExamStore()

// Navigation grid component (inline, ~30 lines)
const navigationGrid = (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
    {questions.map((q, idx) => {
      const isAnswered = (answers[q.id] ?? []).length > 0
      const isBookmarked = bookmarked.includes(q.id)
      const isCurrent = idx === currentIndex
      return (
        <button
          key={q.id}
          onClick={() => {
            if (idx !== currentIndex) {
              setRevealed(false)
              setReviewQuestion(null)
              goToQuestion(idx)
            }
          }}
          style={{
            width: '32px', height: '32px', borderRadius: '6px', border: 'none',
            cursor: 'pointer', fontSize: '11px', fontWeight: 600, position: 'relative',
            background: isCurrent
              ? '#0071e3'
              : isAnswered
              ? 'rgba(0,113,227,0.2)'
              : 'rgba(255,255,255,0.08)',
            color: isCurrent ? '#fff' : isAnswered ? '#2997ff' : 'rgba(255,255,255,0.5)',
            outline: isCurrent ? '2px solid #0071e3' : 'none',
            outlineOffset: '2px',
          }}
          aria-label={`Question ${idx + 1}${isBookmarked ? ' (bookmarked)' : ''}${isAnswered ? ' (answered)' : ''}`}
        >
          {idx + 1}
          {isBookmarked && (
            <span
              style={{
                position: 'absolute', top: '1px', right: '2px',
                fontSize: '7px', color: '#f5a623', lineHeight: 1,
              }}
            >
              ★
            </span>
          )}
        </button>
      )
    })}
  </div>
)
```

### Step 3 — Practice Session Page: Bookmark Button in Question Card Header

Inside the question card `<div>`, add bookmark button to top-right:

```tsx
import { BookmarkButton } from '@/components/practice/bookmark-button'
import { practiceApi } from '@/services/exam-api'

// In question card — wrap in relative div with bookmark button:
<div style={{ position: 'relative' }}>
  <div style={{ position: 'absolute', top: 0, right: 0 }}>
    <BookmarkButton
      bookmarked={bookmarked.includes(question.id)}
      onToggle={async () => {
        toggleBookmarkLocal(question.id)   // optimistic
        try {
          await practiceApi.toggleBookmark(question.id)
        } catch {
          toggleBookmarkLocal(question.id) // revert on failure
        }
      }}
    />
  </div>
  {/* existing question content */}
</div>
```

### Step 4 — Practice Session Page: Report Button + Modal

Add state and modal render to practice-session-page.tsx:

```tsx
import { AnswerReportModal } from '@/components/practice/answer-report-modal'

const [showReport, setShowReport] = useState(false)

// After explanation panel (when revealed):
{revealed && (
  <>
    {/* existing explanation panel */}
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <button
        onClick={() => setShowReport(true)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '12px', color: 'rgba(255,255,255,0.35)',
          padding: '4px 0', letterSpacing: '-0.12px',
        }}
      >
        Report wrong answer
      </button>
    </div>
    <CommentSection questionId={question.id} isRevealed={revealed} />
    {showReport && (
      <AnswerReportModal
        questionId={question.id}
        onClose={() => setShowReport(false)}
      />
    )}
  </>
)}
```

### Step 5 — Practice Session Page: Load Review Data on Reveal

Currently `reviewQuestion` is set but never fetched (the existing code calls `autosave` on reveal but never loads review data). Add fetch after reveal:

```tsx
// In handleReveal, after setRevealed(true):
try {
  const review = await examApi.getExamReview(attemptId!)  // existing endpoint
  const rq = review.questions.find((q) => q.id === question.id) ?? null
  setReviewQuestion(rq)
} catch {
  // Non-blocking — explanation falls back to empty string
}
```

Note: `getExamReview` returns the full attempt review. For practice mode, we only need the current question's data. This is acceptable as questions list is small.

### Step 6 — Practice Setup Page: Bookmarked Only Filter

Add checkbox to `practice-setup-page.tsx`:

```tsx
const [bookmarkedOnly, setBookmarkedOnly] = useState(false)
const { bookmarked, loadBookmarks } = useExamStore()

// Load bookmarks on mount (alongside certifications load):
useEffect(() => {
  loadBookmarks()
}, [loadBookmarks])

// In handleStart — pass filter to start call if needed.
// Current `startExam` doesn't support domain/bookmark filter on backend yet.
// For now: after session starts, filter questions in store.
// If bookmarkedOnly=true and bookmarks exist, filter questions:

const handleStart = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!selectedCertId) return
  setStarting(true)
  try {
    const attempt = await examApi.startExam(selectedCertId as number)
    let questions = attempt.questions
    if (bookmarkedOnly && bookmarked.length > 0) {
      questions = questions.filter((q) => bookmarked.includes(q.id))
    }
    if (bookmarkedOnly && questions.length === 0) {
      addToast({ type: 'warning', message: 'No bookmarked questions found for this certification.' })
      setStarting(false)
      return
    }
    initSession(attempt.id, questions, attempt.time_remaining_seconds, 'practice')
    navigate(`/practice/${attempt.id}`)
  } catch (err) {
    addToast({ type: 'error', message: (err as Error).message || 'Failed to start practice.' })
  } finally {
    setStarting(false)
  }
}

// In form JSX — add checkbox below domain filter:
<label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
  <input
    type="checkbox"
    checked={bookmarkedOnly}
    onChange={(e) => setBookmarkedOnly(e.target.checked)}
    style={{ width: '14px', height: '14px', accentColor: '#f5a623' }}
  />
  <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Bookmarked questions only</span>
</label>
```

### Step 7 — Import Updates in `practice-session-page.tsx`

Full updated import block:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/page-header'
import { useExamStore } from '@/stores/exam-store'
import { AnswerOption } from '@/components/exam/answer-option'
import { examApi, practiceApi } from '@/services/exam-api'
import type { ReviewQuestion } from '@/services/exam-api'
import { useUiStore } from '@/stores/ui-store'
import { CommentSection } from '@/components/practice/comment-section'
import { BookmarkButton } from '@/components/practice/bookmark-button'
import { AnswerReportModal } from '@/components/practice/answer-report-modal'
```

## Final Page Structure (practice-session-page.tsx layout order)

```
<div maxWidth=720px>
  [Header row]          — "Practice Session" title + "End Session" btn
  [Progress bar]        — % through questions
  [Navigation grid]     — free jump between questions (practice mode only)
  [Question card]       — question text + bookmark button (top-right)
  [Answer options]      — locked after reveal
  [Explanation panel]   — shown after reveal; "Report wrong answer" link
  [CommentSection]      — shown after reveal; loads community comments
  [Actions]             — Submit Answer / Next Question / Finish Session
  {showReport && <AnswerReportModal />}
</div>
```

## Notes

- `revealed` state must be reset to `false` when navigating via grid (Step 2 already does this)
- Bookmark toggle is optimistic — revert if API fails (Step 3)
- `getBookmarks()` called in `loadBookmarks` which is called in setup page on mount — ensures bookmarks are fresh when session starts
- `exam-store.ts` `partialize` includes `bookmarked` so bookmarks survive page refresh within a session
