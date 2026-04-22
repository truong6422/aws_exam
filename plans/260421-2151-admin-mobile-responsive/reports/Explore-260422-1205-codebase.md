# Explore: Admin Mobile-Responsive Codebase Analysis
**Date:** 2026-04-22 | **Scope:** Progress tracking models, practice frontend, admin statistics

## 1. User Exam/Practice Progress Models

### ExamAttempt (Core Model)
**Path:** `/apps/backend/apps/exams/models.py`
- **Key Fields:**
  - `user` → FK to User (nullable, supports guests)
  - `certification` → FK to Certification
  - `exam_set` → FK to ExamSet (nullable)
  - `status` → choices: 'in_progress', 'paused', 'submitted', 'expired'
  - `started_at` → auto-set on creation
  - `last_resumed_at` → tracks session resume for time accounting
  - `submitted_at` → populated on submit
  - `time_limit_minutes` → set from certification
  - `accumulated_seconds` → persistent time from prior sessions
  - `score_percentage` → DecimalField (5,2), set on submit
  - `correct_count` → IntegerField, computed on submit
  - `total_questions` → PositiveIntegerField

- **Computed Properties:**
  - `time_spent_total` → accumulated_seconds + current session elapsed
  - `time_remaining_seconds` → limit - time_spent_total
  - `is_expired` → boolean check

### AttemptAnswer (Question Responses)
**Path:** `/apps/backend/apps/exams/models.py`
- **Key Fields:**
  - `attempt` → FK to ExamAttempt (cascade)
  - `question` → FK to Question
  - `selected_answers` → M2M to Answer
  - `is_flagged` → BooleanField
  - `answered_at` → auto_now on each update
  - **unique_together:** (attempt, question)

### UserProgress (Analytics Stub)
**Path:** `/apps/backend/apps/analytics/models.py`
- **Status:** Placeholder for Phase 2 — minimal fields
- **Current Fields:**
  - `user` → OneToOneField (cascade)
  - `total_questions_answered` → PositiveIntegerField
  - `total_correct` → PositiveIntegerField

**Note:** Production tracking relies on ExamAttempt aggregations, not this model.

### Community/Bookmark Models
**Path:** `/apps/backend/apps/questions/models.py`
- **Bookmark** → user-question pair, auto_now_add
- **Comment** → question-author, includes upvotes M2M
- **AnswerReport** → reporter-question, status tracking (pending/reviewed/dismissed)
- **UserExamUnlock** → user-examset purchase record with credits_spent

---

## 2. Practice Mode Frontend Architecture

### Pages
**Path:** `/apps/frontend/src/pages/practice/`

#### practice-setup-page.tsx
- Entry point for practice mode
- Fetches all certifications via `examApi.getCertifications()`
- Prioritizes SAA certifications in display
- Routes to `/practice?certification_id={certId}`
- No progress tracking or persistence

#### practice-session-page.tsx
- Displays 5 questions per page (pagination)
- Query params: `certification_id`, `page`
- **View Answer Flow:**
  1. User selects answer(s) in `PracticeQuestionItem`
  2. Clicks "View Answer" → `handleReveal()` → sets `revealed=true`
  3. **Key:** Answers are client-side only; no backend tracking
  4. Shows `CommentSection` (auto-opens on reveal)
  5. Shows "Report Error" button for authenticated users

### Component: PracticeQuestionItem
**Line 29-184 in practice-session-page.tsx**
- **State:**
  - `selectedAnswers` → array of answer IDs (client-side)
  - `revealed` → boolean (client-side)
  - `commentsOpened` → boolean
  - `showReport` → boolean
- **Key Props:**
  - `question: ReviewQuestion` → includes explanation, is_correct on each answer
  - `isAuthenticated` → gate for bookmark/report
  - `isBookmarked` → from exam-store
  - `onToggleBookmark` → state setter
- **No Backend Call on Reveal** — answers revealed via `is_correct` field in serialized data

### API Endpoints for Practice
**Path:** `/apps/frontend/src/services/exam-api.ts`

```typescript
export const practiceApi = {
  getQuestions: (certId?: number, page = 1) =>
    apiClient.get<PaginatedQuestions>(
      `/questions/practice/?certification_id=${certId || ''}&page=${page}`
    ),
  getComments: (questionId: number) => {...},
  postComment: (questionId: number, body: string, referencedAnswers?: number[], parent?: number | null) => {...},
  upvoteComment: (commentId: number) => {...},
  toggleBookmark: (questionId: number) => {...},
  getBookmarkedIds: () => {...},
  reportAnswer: (questionId: number, reason: string) => {...},
}
```

### PaginatedQuestions Response
```typescript
{
  links: {
    prev: string | null,
    next: string | null,
    current_page: number,
    total_pages: number,
    count: number
  },
  data: ReviewQuestion[]  // includes explanation, is_correct per answer, comment_count
}
```

### Backend Practice Endpoint
**Path:** `/apps/backend/apps/questions/views.py:PracticeQuestionListView`
- **URL:** `GET /api/v1/questions/practice/?certification_id=X&page=Y`
- **Permissions:** AllowAny
- **Pagination:** 5 questions per page
- **Serializer:** `PracticeQuestionSerializer`
  - Includes: id, text, explanation, question_type, answers (with is_correct), comment_count
- **Access Logic:**
  - Staff users → all unlocked sets
  - Authenticated non-staff → free sets + purchased sets + incomplete sets (<65q)
  - Guests → free/incomplete sets only

---

## 3. Admin Statistics & Dashboard

### Admin Dashboard Endpoint
**Path:** `/apps/backend/apps/accounts/admin_views.py:AdminUserViewSet.dashboard_stats`
- **URL:** `GET /api/v1/auth/users/dashboard_stats/`
- **Permissions:** IsAdminUser
- **Response Type:** `DashboardStats`

```python
{
  "users": int,                          # User.objects.count()
  "certifications": int,                 # Certification.objects.count()
  "questions": int,                      # Question.objects.count()
  "exam_sets": {
    "total": int,
    "unlocked": int,                     # is_locked=False count
    "locked": int                        # calculated
  },
  "total_time_seconds": int              # sum(ExamAttempt.accumulated_seconds)
}
```

### Admin Dashboard Frontend
**Path:** `/apps/frontend/src/pages/admin/admin-dashboard-page.tsx`
- Calls `adminApi.getDashboardStats()`
- Displays stat cards: certifications, questions, users, total_exam_time
- Shows unlock rate pie chart (conic-gradient)
- No per-user progress detail view (yet)

### User Analytics Endpoints
**Path:** `/apps/backend/apps/analytics/views.py`

#### OverviewView
- **URL:** `GET /api/v1/analytics/overview/`
- **Requires:** Authenticated user
- **Response:**
  ```python
  {
    "total_attempts": int,
    "total_submitted": int,
    "avg_score": Decimal | null,
    "best_score": Decimal | null,
    "recent_trend": [
      {"date": datetime, "score": Decimal, "certification_code": str},
      ...
    ]  # last 7 submitted attempts
  }
  ```

#### HistoryView
- **URL:** `GET /api/v1/analytics/history/?page=N`
- **Paginated:** 10 per page
- **Response:** List of exam attempts with: id, certification_code, certification_name, started_at, submitted_at, status, score_percentage, total_questions, correct_count

### Admin User Serializer
**Path:** `/apps/backend/apps/accounts/serializers.py:AdminUserSerializer`
- Fields include: id, email, username, name, date_joined, is_staff, is_active, last_login, total_exam_seconds, total_questions_done, total_comments

---

## 4. Exam Attempt Lifecycle (for context)

### API Endpoints
**Path:** `/apps/backend/apps/exams/urls.py`

| Method | URL | View | Purpose |
|--------|-----|------|---------|
| POST | `/exams/start/` | ExamStartView | Create attempt, load questions |
| PATCH | `/exams/{id}/autosave/` | ExamAutosaveView | Save answers mid-exam |
| POST | `/exams/{id}/submit/` | ExamSubmitView | Calculate score, finalize |
| POST | `/exams/{id}/pause/` | ExamPauseView | Pause & save elapsed time |
| POST | `/exams/{id}/resume/` | ExamResumeView | Resume paused attempt |
| GET | `/exams/{id}/review/` | ExamReviewView | Load submitted attempt with answers |
| GET | `/exams/` | ExamListView | List user's attempts (paginated) |

### Score Calculation
**Function:** `_calculate_score()` in exam_views.py
- Compares exact match: selected_answer IDs vs correct_answer IDs
- Only counts if sets are equal (prevents partial credit on multi-select)

---

## 5. Key Tracking Fields Summary

| Model | Field | Tracks | Notes |
|-------|-------|--------|-------|
| ExamAttempt | status | exam lifecycle | in_progress → submitted/expired |
| ExamAttempt | score_percentage | performance | set on submit |
| ExamAttempt | correct_count | performance | calculated on submit |
| ExamAttempt | accumulated_seconds | time spent | persistent across pause/resume |
| ExamAttempt | time_limit_minutes | constraint | from certification |
| ExamAttempt | submitted_at | completion | null until submit |
| AttemptAnswer | is_flagged | user annotation | updated by user mid-exam |
| AttemptAnswer | answered_at | response time | auto_now per update |
| UserProgress | total_questions_answered | aggregate (stub) | not updated in code |
| UserProgress | total_correct | aggregate (stub) | not updated in code |
| Bookmark | created_at | user interest | tracks questions saved for review |
| Comment | upvotes M2M | engagement | user upvote tracking |

---

## 6. Practice Mode vs Exam Mode

| Aspect | Practice | Exam |
|--------|----------|------|
| **Progress Tracking** | None (client-side reveal) | Full (ExamAttempt record) |
| **View Answers** | Immediate, no backend call | After submit only |
| **Scoring** | None | Auto-calculated |
| **Access Control** | Free/incomplete/purchased | Purchased or free |
| **Comments** | Visible after reveal | N/A |
| **Bookmarking** | Supported (persisted) | N/A |
| **Serializer** | PracticeQuestionSerializer | QuestionExamSerializer → QuestionReviewSerializer |
| **Question Fields** | text, explanation, is_correct | Exam: no is_correct; Review: with is_correct |

---

## 7. File Paths Reference

**Backend Models:**
- `/apps/backend/apps/exams/models.py` → ExamAttempt, AttemptAnswer
- `/apps/backend/apps/analytics/models.py` → UserProgress
- `/apps/backend/apps/questions/models.py` → Certification, Question, Answer, Comment, AnswerReport, Bookmark, UserExamUnlock
- `/apps/backend/apps/accounts/models.py` → User

**Backend API:**
- `/apps/backend/apps/exams/exam_views.py` → Exam lifecycle (start, submit, review)
- `/apps/backend/apps/exams/serializers.py` → ExamAttempt serializers
- `/apps/backend/apps/questions/views.py` → PracticeQuestionListView, CommentListCreateView
- `/apps/backend/apps/questions/serializers.py` → PracticeQuestionSerializer, QuestionExamSerializer, QuestionReviewSerializer
- `/apps/backend/apps/analytics/views.py` → OverviewView, HistoryView
- `/apps/backend/apps/accounts/admin_views.py` → AdminUserViewSet.dashboard_stats

**Frontend Pages:**
- `/apps/frontend/src/pages/practice/practice-setup-page.tsx` → Cert selection
- `/apps/frontend/src/pages/practice/practice-session-page.tsx` → Question display & view answer
- `/apps/frontend/src/pages/admin/admin-dashboard-page.tsx` → Admin stats display
- `/apps/frontend/src/pages/dashboard/dashboard-page.tsx` → User dashboard (not checked)

**Frontend Services:**
- `/apps/frontend/src/services/exam-api.ts` → examApi, practiceApi
- `/apps/frontend/src/services/admin-api.ts` → adminApi

**Frontend Components:**
- `/apps/frontend/src/components/practice/bookmark-button.tsx`
- `/apps/frontend/src/components/practice/comment-section.tsx`
- `/apps/frontend/src/components/practice/comment-item.tsx`
- `/apps/frontend/src/components/practice/answer-report-modal.tsx`
- `/apps/frontend/src/components/exam/answer-option.tsx`

**Frontend Stores:**
- `/apps/frontend/src/stores/exam-store.ts` → bookmarked questions state

---

## 8. Unresolved Questions

1. **Practice Session Progress:** Is there a requirement to track practice mode performance (attempts, time spent per practice session)?
2. **Mobile Responsiveness:** Which components specifically need mobile optimization? (setup page, session page, admin dashboard?)
3. **Admin User Stats:** Should admin dashboard show per-user statistics (time, questions attempted, score distribution)?
4. **Practice Analytics:** Should practice sessions be logged for analytics, or remain purely local?
5. **Responsive Grid:** Current grid layout uses `gridTemplateColumns: 'repeat(auto-fill, minmax(...))'` — should this be more conservative for mobile?

