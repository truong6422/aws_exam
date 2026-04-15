# Frontend Patterns Research Report: Exam/Quiz UI with Next.js + Zustand + TailwindCSS
**Date:** 2026-03-22
**Status:** Complete
**Researcher:** Frontend Architecture

---

## EXECUTIVE SUMMARY

Current project uses **Vite + React SPA** (not Next.js). Research validates Next.js 14 App Router as viable for MVP but recommends **staying with Vite for MVP** (YAGNI principle—migrate only when needed). Zustand + TailwindCSS proven for exam state management & UI. Key findings provide patterns for all 5 topics.

---

## 1. EXAM SESSION STATE WITH ZUSTAND

### Architecture Pattern
```
useExamStore (Zustand):
├── sessionId, mode, timeLimitMinutes
├── currentIndex, answers map {questionId -> selectedAnswerIds}
├── flaggedQuestions (Set)
├── timeRemaining (managed via useEffect interval)
└── persist middleware → localStorage
```

### Implementation Best Practices

**Persist Middleware:** Use Zustand's `persist` middleware to auto-save to localStorage on state changes. Recovers on page refresh.

```typescript
interface ExamSessionState {
  sessionId: string | null
  mode: 'exam' | 'practice'
  answers: Map<number, string[]>  // questionId -> selected answer IDs
  flaggedQuestions: Set<number>
  timeRemaining: number
  startTime: number

  // Actions
  updateAnswer: (questionId, answerIds) => void
  toggleFlag: (questionId) => void
  syncToBackend: () => Promise<void>  // autosave every 30s
}
```

**Autosave Pattern:** Debounce sync to backend—don't call API on every keystroke.
- Set Zustand listener with 30s debounce
- Parallel timeout: submit auto-saves if no manual change
- Show "Saving..." indicator during sync
- Recover from sync failure: log error, keep state in localStorage

**localStorage Recovery:**
- On app init, check `localStorage.getItem('exam-session')`
- Validate session still exists on backend (timeout checks)
- If backend session expired, redirect to exam list
- If offline, keep working locally; sync when back online

### Constraints
- **Timer state separate:** Manage timeRemaining separately from store state (pure state, no effects)
- **Answers immutable:** Use Map for O(1) lookup; persist answers array to localStorage
- **Flagged questions:** Use Set for efficient toggle; convert to array for API payload

---

## 2. QUESTION NAVIGATION GRID

### Color-Coded Status System (AWS Exam Style)

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| **Unanswered** | Gray (`bg-gray-300`) | Empty square | Not yet answered |
| **Answered** | Green (`bg-green-400`) | Checkmark | Answer selected |
| **Flagged** | Orange (`bg-orange-400`) | Flag | Marked for review |
| **Answered + Flagged** | Yellow (`bg-yellow-400`) | Flag + checkmark | Both states |

### Component Pattern (React + TailwindCSS)

```tsx
interface QuestionGridProps {
  totalQuestions: number
  answers: Map<number, string[]>
  flagged: Set<number>
  currentIndex: number
  onSelectQuestion: (index) => void
}

function QuestionGrid({ totalQuestions, answers, flagged, currentIndex, onSelectQuestion }) {
  return (
    <div className="grid grid-cols-8 gap-2 p-4 bg-slate-50 rounded-lg">
      {Array.from({ length: totalQuestions }).map((_, i) => {
        const answered = answers.has(i)
        const isFlagged = flagged.has(i)
        const isCurrentt = i === currentIndex

        // Color logic
        let bgColor = 'bg-gray-300'
        if (answered && isFlagged) bgColor = 'bg-yellow-400'
        else if (answered) bgColor = 'bg-green-400'
        else if (isFlagged) bgColor = 'bg-orange-400'

        return (
          <button
            key={i}
            onClick={() => onSelectQuestion(i)}
            className={`
              w-10 h-10 rounded font-semibold text-sm
              transition-all duration-200
              ${bgColor}
              ${isCurrentt ? 'ring-2 ring-blue-600 ring-offset-1' : ''}
              hover:scale-105 active:scale-95
            `}
          >
            {i + 1}
          </button>
        )
      })}
    </div>
  )
}
```

**Responsive:** Use `grid-cols-6` for mobile, `grid-cols-10` for desktop. Wrap with `flex flex-wrap` if needed.

**Accessibility:** Add `aria-label`, `aria-current` for screen readers.

### Interactive Features
- **Click → Jump:** Clicking grid item changes currentIndex in Zustand
- **Visual focus:** Ring around current question
- **Hover effect:** Subtle scale for desktop UX
- **Status legend:** Below grid shows color meanings

---

## 3. SERVER-SIDE TIMER UX

### Countdown Component Architecture

**Key Challenge:** Keep timer in sync across tab refocus, page visibility, network latency.

```tsx
interface TimerState {
  totalSeconds: number  // 130*60 for SAA exam
  currentSeconds: number
  isRunning: boolean
  shouldSubmitOnZero: boolean
}

function ExamTimer({ totalSeconds, onTimeUp, onTick }) {
  const [time, setTime] = useState(totalSeconds)
  const [isVisible, setIsVisible] = useState(true)

  // Tick effect
  useEffect(() => {
    if (!isVisible) return  // Don't count when tab hidden

    const interval = setInterval(() => {
      setTime(t => {
        const next = t - 1
        onTick?.(next)

        // Auto-submit at 0
        if (next <= 0) {
          clearInterval(interval)
          onTimeUp?.()
          return 0
        }
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isVisible, onTimeUp, onTick])

  // Page Visibility API
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const minutes = Math.floor(time / 60)
  const seconds = time % 60

  // Color warn at <5 min
  const isWarning = time < 300

  return (
    <div className={`text-2xl font-mono font-bold ${isWarning ? 'text-red-600' : 'text-gray-800'}`}>
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  )
}
```

**Page Visibility API:** Stops timer when tab not focused (prevents cheat timers). Resumes on focus.

**Backend Sync:** Server validation on submit ensures honest exam time. Don't rely on client timer alone.

**Warning States:**
- `<5 min` → Red text
- `<1 min` → Red + pulse animation (Tailwind: `animate-pulse`)
- `0` → Auto-submit form

### Common Pitfalls to Avoid
- ❌ Don't trust client-side timer for final submit validation
- ❌ Don't lose time on refresh—sync to backend periodically
- ❌ Don't count time when tab hidden (Page Visibility API)

---

## 4. PRACTICE MODE FEEDBACK UX

### Feedback Flow After Submission

**User submits answer → API response includes:**
```json
{
  "userAnswer": "B",
  "correctAnswer": "B",
  "isCorrect": true,
  "explanation": "DynamoDB is fully managed NoSQL...",
  "whyOthersWrong": {
    "A": "RDS is relational, not NoSQL",
    "C": "Redshift is data warehouse",
    "D": "Aurora is also relational"
  }
}
```

### Component Pattern (Framer Motion Style Animations)

```tsx
function PracticeFeedback({ feedback, onNextQuestion }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    setShow(true)  // Trigger animation
  }, [feedback])

  const bgColor = feedback.isCorrect ? 'bg-green-50' : 'bg-red-50'
  const borderColor = feedback.isCorrect ? 'border-green-300' : 'border-red-300'
  const badgeColor = feedback.isCorrect
    ? 'bg-green-200 text-green-800'
    : 'bg-red-200 text-red-800'

  return (
    <div
      className={`
        border-2 rounded-lg p-6 transition-all duration-300
        ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
        ${bgColor} ${borderColor}
      `}
    >
      {/* Result badge */}
      <span className={`inline-block px-3 py-1 rounded-full font-semibold ${badgeColor}`}>
        {feedback.isCorrect ? '✓ Correct' : '✗ Incorrect'}
      </span>

      {/* Correct answer */}
      <div className="mt-4">
        <p className="font-semibold text-gray-900">Correct Answer:</p>
        <p className="text-lg font-bold text-blue-600">{feedback.correctAnswer}</p>
      </div>

      {/* Explanation */}
      <div className="mt-4">
        <p className="font-semibold text-gray-900">Explanation:</p>
        <p className="text-gray-800 mt-2">{feedback.explanation}</p>
      </div>

      {/* Why others wrong */}
      <div className="mt-4">
        <p className="font-semibold text-gray-900">Why Others Are Wrong:</p>
        <ul className="mt-2 space-y-1">
          {Object.entries(feedback.whyOthersWrong).map(([option, reason]) => (
            <li key={option} className="text-sm text-gray-700">
              <span className="font-semibold">{option}:</span> {reason}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onNextQuestion}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Next Question
      </button>
    </div>
  )
}
```

**Animation Details:**
- Fade-in + slide-up on appear (Tailwind: `transition-all` with `scale-95` → `scale-100`)
- Smooth color transitions between correct/incorrect states
- Optional confetti on full-correct streak (cheerio library)

---

## 5. NEXT.JS APP ROUTER DATA FETCHING STRATEGY

### Architecture Decision: Client vs Server Components

**For Exam Sessions: MUST be Client Component**
```typescript
// app/exam/[sessionId]/page.tsx
'use client'  // ← Required for real-time state

import { useExamStore } from '@/stores/exam-store'
import { useEffect } from 'react'

export default function ExamPage({ params }) {
  const store = useExamStore()

  // Fetch exam data on mount
  useEffect(() => {
    fetchExamSession(params.sessionId)
  }, [params.sessionId])

  return (
    // Exam UI here
  )
}
```

**Why Client?**
- Zustand requires browser API (`localStorage`, `useEffect` interval)
- Real-time state sync (answer changes, timer ticks)
- Page Visibility API for tab focus detection
- Browser listeners don't work in server components

### Hybrid Pattern (Recommended for MVP)

```
1. Server Component (app/exam/page.tsx):
   - Validate user has active session
   - Check time limit not exceeded
   - Return redirect or pass sessionId to client

2. Client Component (app/exam/[sessionId]/page.tsx):
   - Mount Zustand exam store
   - Fetch questions via REST API
   - Handle timer, navigation, autosave
   - Zustand persists to localStorage
```

### API Fetching Patterns

**Questions Fetch (one-time):**
```typescript
// app/exam/[sessionId]/page.tsx
useEffect(() => {
  const fetchQuestions = async () => {
    const res = await fetch(`/api/v1/exam/${sessionId}/questions`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    store.setQuestions(data.questions)
  }

  fetchQuestions()
}, [sessionId, store, token])
```

**Autosave (debounced every 30s):**
```typescript
useEffect(() => {
  const timer = setTimeout(async () => {
    const { answers, sessionId } = store.getState()
    await fetch(`/api/v1/exam/${sessionId}/autosave`, {
      method: 'POST',
      body: JSON.stringify({ answers: Array.from(answers.entries()) }),
      headers: { 'Content-Type': 'application/json' }
    })
  }, 30000)

  return () => clearTimeout(timer)
}, [store.answers])  // Re-run if answers change
```

**Submit Exam (on time up or manual):**
```typescript
const submitExam = async () => {
  const { sessionId, answers } = store.getState()
  const response = await fetch(`/api/v1/exam/${sessionId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers: Object.fromEntries(answers) })
  })
  router.push(`/exam/${sessionId}/results`)
}
```

---

## 6. MIGRATION DECISION: VITE vs NEXT.JS (MVP RECOMMENDATION)

### Current State
- **Project:** Vite + React Router v6
- **Store:** Zustand (already in place)
- **Styling:** TailwindCSS (already in place)

### Quick Comparison

| Aspect | Vite SPA | Next.js App Router |
|--------|----------|-------------------|
| **Setup Time** | ~5 min | ~15 min |
| **App Router** | React Router v6 (client-side) | File-based routing (automatic) |
| **SSR/SSG** | Not built-in | Built-in (unnecessary for exam UX) |
| **Exam Real-time** | Works perfectly | Works, but overkill |
| **Deployment** | SPA static/Node | Serverless or Node |
| **Learning Curve** | Lower | Medium |
| **Bundle Size** | Smaller | Larger (Next.js overhead) |

### MVP Recommendation: **STICK WITH VITE**
**Rationale (YAGNI):**
- Exam pages are client-heavy (real-time state, localStorage, timers)
- No SEO benefit (exam is authenticated, user-specific)
- No need for SSR (initial load from SPA is fine)
- Vite faster dev experience → faster MVP iteration
- React Router v6 handles nested layouts well

**Future Migration (Post-MVP):**
- If need backend-rendered dashboards with SEO → switch to Next.js
- If need API routes (currently using separate Django backend) → maybe useful
- If need image optimization → Next.js Image component
- Currently? Not needed. Keep Vite.

### If Forced to Use Next.js
1. App Router requires `'use client'` for exam page
2. Zustand works perfectly in client components
3. Data fetching pattern:
   - `/exam/[sessionId]` → server component → validate session → render client exam
   - Client component uses `'use client'` → Zustand + timers + autosave
4. No advantage over Vite for this use case

---

## 7. KEY IMPLEMENTATION PATTERNS SUMMARY

### Zustand Store Pattern
```typescript
export const useExamStore = create<ExamState>()(
  persist(
    (set, get) => ({
      // State
      sessionId: null,
      answers: new Map(),
      flagged: new Set(),

      // Actions
      updateAnswer: (qId, aIds) => set(state => ({
        answers: new Map(state.answers).set(qId, aIds)
      })),

      // API sync
      syncToBackend: async () => {
        const { sessionId, answers } = get()
        await fetch(`/api/v1/exam/${sessionId}/autosave`, {
          method: 'POST',
          body: JSON.stringify({ answers: Object.fromEntries(answers) })
        })
      }
    }),
    {
      name: 'exam-store',  // localStorage key
      partialize: (state) => ({  // Only persist these
        answers: state.answers,
        flagged: state.flagged
      })
    }
  )
)
```

### Timer + Page Visibility Pattern
```typescript
const useExamTimer = (initialSeconds, onTimeUp) => {
  const [time, setTime] = useState(initialSeconds)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (!isVisible) return
    const id = setInterval(() => setTime(t => t - 1), 1000)
    return () => clearInterval(id)
  }, [isVisible])

  useEffect(() => {
    const handler = () => setIsVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  useEffect(() => {
    if (time === 0) onTimeUp?.()
  }, [time, onTimeUp])

  return { minutes: Math.floor(time / 60), seconds: time % 60 }
}
```

### Autosave Debounce Pattern
```typescript
const useAutosave = (store, delayMs = 30000) => {
  useEffect(() => {
    const timer = setTimeout(() => store.syncToBackend(), delayMs)
    return () => clearTimeout(timer)
  }, [store.answers])  // Re-trigger on answer change
}
```

---

## UNRESOLVED QUESTIONS

1. **Backend autosave conflict:** What if user is answering while autosave syncs? Need optimistic updates + conflict resolution strategy?
2. **Offline support:** Should exam work offline with service workers, or require internet?
3. **Multiple-choice questions:** Support multiple correct answers (MSET type)? Affects answer storage format.
4. **Question randomization:** Backend generates random set or frontend shuffles? (Frontend = better UX, no reshuffle on refresh)
5. **Accessibility:** WCAG 2.1 AA compliance—keyboard navigation, screen reader support for timer?

---

## NEXT STEPS FOR IMPLEMENTATION

1. **Phase 1:** Build Zustand exam store with localStorage persist
2. **Phase 2:** Implement question grid component + navigation
3. **Phase 3:** Add countdown timer with Page Visibility API
4. **Phase 4:** Build practice mode feedback flow
5. **Phase 5:** Integrate API autosave + backend sync
6. **Phase 6:** Write tests (Jest + React Testing Library)

**Estimated Timeline:** 3-4 sprints for complete implementation
