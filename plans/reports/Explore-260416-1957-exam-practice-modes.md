# AWS Exam App: Exam & Practice Modes Exploration

## 1. Exam Mode vs Practice Mode Features

### Exam Mode (Timed)
**Frontend:** `/home/truong/project/aws-exam-app/apps/frontend/src/pages/exam/exam-session-page.tsx`

**Features:**
- Timed exam with countdown timer (visual warning/critical states)
- Question navigation grid showing answered/flagged/unanswered status
- Flag questions for review
- Autosave answers every 30s (transparent to user)
- Submit confirmation dialog
- No answer reveal during exam
- NO explanation until after submission

**Key Components:**
- ExamTimer: Displays time remaining with color-coded urgency
- QuestionNavigationGrid: Thumbnail grid of all questions
- AnswerOption: Radio/checkbox input supporting single and multiple choice
- Answer validation prevents submission if time expires

### Practice Mode (Instant Feedback)
**Frontend:** `/home/truong/project/aws-exam-app/apps/frontend/src/pages/practice/practice-session-page.tsx`

**Features:**
- NO timer / NO time limit
- Instant feedback after selecting answer ("Show Answer" button)
- Explanation revealed immediately (from Question.explanation field)
- Sequential only navigation (no grid, no jumps)
- Correct answers highlighted in green, incorrect in red
- Progress bar showing current question/total
- "End Session" button to exit early
- Optional domain filter at setup
- No autosave (saves on submit only)

**Key Components:**
- PracticeSessionPage: Reveals answer state on button click
- AnswerOption with `isRevealed` and `isCorrect` props for feedback styling
- Explanation panel shown conditionally

### Setup Pages
- **Exam:** `/home/truong/project/aws-exam-app/apps/frontend/src/pages/exam/exam-setup-page.tsx` - Grid of certification cards, no domain filter
- **Practice:** `/home/truong/project/aws-exam-app/apps/frontend/src/pages/practice/practice-setup-page.tsx` - Dropdown-based form with optional domain filter

---

## 2. Question Display Structure

### Frontend Components (Single Reusable Component)
**File:** `/home/truong/project/aws-exam-app/apps/frontend/src/components/exam/answer-option.tsx`

**Single AnswerOption Component** serves both modes:
```typescript
interface Props {
  answer: Answer
  isSelected: boolean
  questionType: 'single' | 'multiple'
  onSelect: (answerId: number) => void
  isRevealed?: boolean          // Practice mode: show correct/incorrect feedback
  isCorrect?: boolean           // Practice mode: marks answer as correct
}
```

**Visual States:**
- Normal: Light gray border, semi-transparent background
- Selected (exam): Blue border + background
- Revealed Correct (practice): Green border + background
- Revealed Incorrect (practice): Red border + background
- Indicator: Radio button (single) vs checkbox (multiple)

### Question Display Flow
1. **Question Card:** Shows text, question type badge, and flag button
2. **Answers:** List of AnswerOption components
3. **Explanation (practice only):** Shown in blue info box after reveal

**Question Type Support:**
- Single: Radio buttons (one answer only)
- Multiple: Checkboxes (one or more answers, all must be correct)

---

## 3. Comment/Discussion System

**Status:** ❌ DOES NOT EXIST

- No Comment, Discussion, or Reply models in Django
- No comment endpoints in backend APIs
- No comment UI components in frontend
- No mention in any serializers
- Searched all backend/apps and frontend/src - no matches

---

## 4. Data Model for Questions

### Django Models
**File:** `/home/truong/project/aws-exam-app/apps/backend/apps/questions/models.py`

```python
class Certification(TimestampedModel):
    code: CharField(unique=True)
    name: CharField
    description: TextField
    time_limit_minutes: PositiveIntegerField = 130
    total_questions: PositiveIntegerField = 65
    passing_score: PositiveIntegerField = 72

class Domain(TimestampedModel):
    certification: FK → Certification
    name: CharField
    weight_percentage: PositiveIntegerField = 0
    # unique_together: (certification, name)

class Question(TimestampedModel):
    SINGLE = "single"
    MULTIPLE = "multiple"
    
    domain: FK → Domain
    text: TextField
    explanation: TextField (blank=True)
    source: CharField(blank=True)
    question_type: CharField(choices=[SINGLE, MULTIPLE])

class Answer(Model):
    question: FK → Question
    text: TextField
    is_correct: BooleanField
    # unique_together: (question, text)
```

### Exam Attempt Models
**File:** `/home/truong/project/aws-exam-app/apps/backend/apps/exams/models.py`

```python
class ExamAttempt(TimestampedModel):
    STATUS_CHOICES = ['in_progress', 'submitted', 'expired']
    
    user: FK → User
    certification: FK → Certification
    started_at: DateTimeField(auto_now_add)
    submitted_at: DateTimeField(null=True)
    time_limit_minutes: PositiveIntegerField
    status: CharField(choices=STATUS_CHOICES)
    score_percentage: DecimalField(5,2, null=True)
    total_questions: PositiveIntegerField
    correct_count: IntegerField(null=True)
    
    @property
    def time_remaining_seconds: int
    @property
    def is_expired: bool

class AttemptAnswer(Model):
    attempt: FK → ExamAttempt
    question: FK → Question
    selected_answers: M2M → Answer
    answered_at: DateTimeField(auto_now)
    # unique_together: (attempt, question)
```

### Key Features:
- Explanation stored per Question (not per Answer)
- Question type determines validation (single vs multiple correct)
- Scoring: Exact match of selected_answers with correct answers required
- Time tracking: Calculated from started_at, validated server-side
- User isolation: Answers bound to user via attempt

---

## 5. Frontend Framework & State Management

### Framework & Tools
**File:** `/home/truong/project/aws-exam-app/apps/frontend/package.json`

- **UI Framework:** React 18.3.1
- **Routing:** React Router DOM 6.26.2
- **State Management:** Zustand 4.5.5 (with persist middleware)
- **Build Tool:** Vite 5.4.2
- **Styling:** Tailwind CSS 3.4.11 (+ inline styles)
- **Testing:** Vitest 4.1.0
- **Language:** TypeScript 5.5.3

### State Management Architecture
**File:** `/home/truong/project/aws-exam-app/apps/frontend/src/stores/exam-store.ts`

**Zustand Store** (persisted to localStorage):
```typescript
interface ExamState {
  attemptId: number | null
  mode: 'exam' | 'practice'         // Differentiates mode
  questions: Question[]              // NOT persisted (re-fetched on reload)
  answers: Record<number, number[]>  // question_id → answer_ids
  flagged: number[]                  // question_ids
  currentIndex: number
  timeRemaining: number
  isSaving: boolean
}

interface ExamActions {
  initSession(attemptId, questions, timeRemaining, mode)
  updateAnswer(questionId, answerIds)
  toggleFlag(questionId)
  goToQuestion(index)
  setTimeRemaining(seconds)
  syncToBackend()
  clearSession()
  getAnswersAsPartial()
}
```

**Persistence Strategy:**
- Answers, flags, currentIndex, attemptId persisted to localStorage
- Questions NOT persisted (prevents stale data, requires re-fetch)
- Hard refresh with no questions in store → redirects to setup

**Other Stores:**
- **ui-store.ts:** Toast notifications (addToast, removeToast)
- **auth-store.ts:** User authentication state

### API Client
**File:** `/home/truong/project/aws-exam-app/apps/frontend/src/services/exam-api.ts`

**Exam Endpoints:**
- `POST /exams/start/` → Creates ExamAttempt, returns questions
- `PATCH /exams/{id}/autosave/` → Saves partial answers (exam only)
- `POST /exams/{id}/submit/` → Submits exam, returns score
- `GET /exams/{id}/review/` → Full review with correct answers
- `GET /exams/` → Paginated list of user attempts
- `GET /questions/certifications/` → Public certification list
- `GET /questions/certifications/{id}/domains/` → Domain list (auth required)

**Key Type Separation:**
- `QuestionExamSerializer`: No is_correct, no explanation (anti-cheat)
- `QuestionReviewSerializer`: Includes is_correct, explanation
- Answer fields withheld during exam, revealed only after submit

---

## Backend API Endpoints

**File:** `/home/truong/project/aws-exam-app/apps/backend/apps/exams/exam_views.py`

- **ExamStartView** (POST /exams/start/): Creates attempt with random 65 questions
- **ExamAutosaveView** (PATCH /exams/{pk}/autosave/): Validates time, saves answers
- **ExamSubmitView** (POST /exams/{pk}/submit/): Locks attempt, calculates score
- **ExamReviewView** (GET /exams/{pk}/review/): Returns full questions with answers
- **ExamListView** (GET /exams/): Paginated user attempt history

**Security:**
- User isolation: All views filter by request.user
- Question ID injection prevention: Only accepts IDs from attempt_answers
- Time expiration: Server-side validation on submit/autosave
- Anti-cheat: is_correct and explanation hidden during exam

---

## File Inventory

### Backend
```
/apps/backend/apps/questions/
  ├─ models.py           # Certification, Domain, Question, Answer
  ├─ serializers.py      # Exam vs Review serializers
  ├─ views.py            # Certification/Domain list views
  
/apps/backend/apps/exams/
  ├─ models.py           # ExamAttempt, AttemptAnswer
  ├─ exam_views.py       # Start, autosave, submit, review, list
  ├─ serializers.py      # ExamAttempt serializers
```

### Frontend
```
/apps/frontend/src/
  ├─ stores/
  │  ├─ exam-store.ts    # Zustand exam session state
  │  ├─ ui-store.ts      # Toast notifications
  │  └─ auth-store.ts
  ├─ services/
  │  └─ exam-api.ts      # API calls, type definitions
  ├─ pages/
  │  ├─ exam/
  │  │  ├─ exam-setup-page.tsx
  │  │  ├─ exam-session-page.tsx
  │  │  └─ exam-result-page.tsx
  │  └─ practice/
  │     ├─ practice-setup-page.tsx
  │     └─ practice-session-page.tsx
  └─ components/exam/
     ├─ answer-option.tsx           # Shared answer component
     ├─ exam-timer.tsx
     └─ question-navigation-grid.tsx
```

---

## Summary

| Feature | Exam Mode | Practice Mode |
|---------|-----------|---------------|
| Timer | ✓ (130 min default) | ✗ |
| Autosave | ✓ (every 30s) | ✗ |
| Show Answer | ✗ (post-submit only) | ✓ (immediate) |
| Explanation | After submit | Immediate |
| Navigation | Grid + previous/next | Sequential only |
| Flag Questions | ✓ | ✗ |
| Comment System | ✗ | ✗ |
| Single/Multiple | Both supported | Both supported |

