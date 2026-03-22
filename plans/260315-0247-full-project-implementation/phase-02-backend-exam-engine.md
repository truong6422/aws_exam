---
spec_id: phase-02-backend-exam-engine
version: "1.0"
status: completed
blockedBy:
  - phase-01-backend-question-bank
agents:
  - fullstack-developer
acceptance_criteria:
  - "ExamAttempt and AttemptAnswer models pass makemigrations + migrate"
  - "POST /api/v1/exams/start/ creates attempt with random questions and returns ExamSerializer data (no is_correct)"
  - "PATCH /api/v1/exams/{id}/autosave/ saves partial answers and returns time_remaining_seconds"
  - "POST /api/v1/exams/{id}/submit/ calculates score correctly"
  - "Submitting after time expired marks attempt as 'expired' and still returns score"
  - "GET /api/v1/exams/{id}/review/ returns ReviewSerializer data (is_correct + explanation visible)"
  - "GET /api/v1/exams/ lists only the authenticated user's attempts (paginated)"
  - "Users cannot access other users' attempts"
---

# Phase 02 — Backend: Exam & Practice Engine

## Overview

- **Priority**: P0 (Core product feature)
- **Depends on**: P1 (Question Bank models must exist)
- **Blocks**: P4 (Analytics), P6 (Frontend Exam)
- **Description**: Full exam session lifecycle — start exam, autosave answers, submit with server-side timer validation, review with explanations. Replace stub Exam model with ExamAttempt + AttemptAnswer.

## Related Code Files

### Modify
- `apps/backend/apps/exams/models.py` — replace stub with ExamAttempt + AttemptAnswer
- `apps/backend/apps/exams/serializers.py` — create exam session serializers
- `apps/backend/apps/exams/views.py` — CRUD views for exam lifecycle
- `apps/backend/apps/exams/urls.py` — wire 5 endpoints
- `apps/backend/apps/exams/admin.py` — register models
- `apps/backend/config/urls.py` — add `/api/v1/exams/` prefix

### Create
- None (all files exist as stubs)

### Delete
- None (replace Exam stub model — migration will handle)

## Implementation Steps

### Step 1: Replace Exam Models

Remove stub `Exam` model. Create two new models in `apps/exams/models.py`:

1. **ExamAttempt** — extends `TimestampedModel`:
   - `STATUS = [('in_progress','In Progress'),('submitted','Submitted'),('expired','Expired')]`
   - `user`: ForeignKey(settings.AUTH_USER_MODEL, CASCADE, related_name='exam_attempts')
   - `certification`: ForeignKey('questions.Certification', CASCADE)
   - `started_at`: DateTimeField(auto_now_add=True)
   - `submitted_at`: DateTimeField(null=True, blank=True)
   - `time_limit_minutes`: PositiveIntegerField()
   - `status`: CharField(max_length=20, choices=STATUS, default='in_progress')
   - `score_percentage`: DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
   - `total_questions`: PositiveIntegerField()
   - `correct_count`: IntegerField(null=True, blank=True)
   - Property `time_remaining_seconds`: `max(0, int(time_limit_minutes * 60 - elapsed))`
   - Property `is_expired`: `time_remaining_seconds == 0 and status == 'in_progress'`

2. **AttemptAnswer** — plain `models.Model`:
   - `attempt`: ForeignKey(ExamAttempt, CASCADE, related_name='attempt_answers')
   - `question`: ForeignKey('questions.Question', CASCADE)
   - `selected_answers`: ManyToManyField('questions.Answer', blank=True)
   - `answered_at`: DateTimeField(auto_now=True)
   - Meta: `unique_together = ('attempt', 'question')`

### Step 2: Create Serializers

In `apps/exams/serializers.py`:

1. **StartExamSerializer** — input serializer:
   - `certification_id`: IntegerField(required=True)
   - Validate certification exists

2. **PartialAnswerSerializer** — for autosave:
   - `question_id`: IntegerField()
   - `answer_ids`: ListField(child=IntegerField(), allow_empty=True)

3. **ExamAttemptListSerializer** — for GET /exams/:
   - Fields: `[id, certification, started_at, submitted_at, status, score_percentage, total_questions, correct_count, time_remaining_seconds]`
   - `certification` nested with code + name only

4. **ExamAttemptDetailSerializer** — for start response:
   - Fields: `[id, certification, started_at, time_limit_minutes, status, total_questions, time_remaining_seconds, questions]`
   - `questions` uses `QuestionExamSerializer` (from questions app — NO is_correct)

5. **ExamReviewSerializer** — for review response:
   - Fields: `[id, certification, score_percentage, correct_count, total_questions, questions, user_answers]`
   - `questions` uses `QuestionReviewSerializer` (WITH is_correct + explanation)
   - `user_answers`: dict mapping question_id → list of selected answer_ids

6. **ExamSubmitResponseSerializer** — for submit response:
   - Fields: `[id, score_percentage, correct_count, total_questions, status, submitted_at]`

### Step 3: Create Views

In `apps/exams/views.py`:

1. **ExamStartView** (POST `/exams/start/`):
   - Validate certification_id exists
   - Check user doesn't have an existing in_progress attempt for same cert (optional: allow multiple)
   - Create ExamAttempt with `time_limit_minutes` from certification, `total_questions` from certification
   - Randomly select `total_questions` from certification's questions using `order_by('?')[:total_questions]`
   - Create AttemptAnswer stubs for each question (empty selected_answers)
   - Return ExamAttemptDetailSerializer with questions (ExamSerializer — NO is_correct)

2. **ExamAutosaveView** (PATCH `/exams/{id}/autosave/`):
   - Get attempt by id, verify `attempt.user == request.user`
   - If `attempt.is_expired`: auto-expire and return error
   - Parse list of `{question_id, answer_ids}` from body
   - For each: `get_or_create` AttemptAnswer, then `selected_answers.set(answer_ids)`
   - Return `{status: 'saved', time_remaining_seconds: attempt.time_remaining_seconds}`

3. **ExamSubmitView** (POST `/exams/{id}/submit/`):
   - Get attempt, verify ownership, verify `status == 'in_progress'`
   - Accept optional final answers in body (same format as autosave) — save them first
   - If `attempt.is_expired`: set `status = 'expired'` (but still calculate score)
   - Calculate score: for each AttemptAnswer, check if `selected_answers` exactly match the question's correct answers
   - Set `correct_count`, `score_percentage = (correct_count / total_questions) * 100`
   - Set `submitted_at = timezone.now()`, `status = 'submitted'` (or 'expired')
   - Return ExamSubmitResponseSerializer

4. **ExamReviewView** (GET `/exams/{id}/review/`):
   - Get attempt, verify ownership, verify `status in ('submitted', 'expired')`
   - Return ExamReviewSerializer with full question data + user's answers

5. **ExamListView** (GET `/exams/`):
   - `queryset = ExamAttempt.objects.filter(user=request.user).order_by('-started_at')`
   - Paginated, uses ExamAttemptListSerializer

### Step 4: Wire URLs

In `apps/exams/urls.py`:
```
start/ → ExamStartView (POST)
<int:pk>/autosave/ → ExamAutosaveView (PATCH)
<int:pk>/submit/ → ExamSubmitView (POST)
<int:pk>/review/ → ExamReviewView (GET)
(root) → ExamListView (GET)
```

In `config/urls.py`, add:
```python
path("api/v1/exams/", include(("apps.exams.urls", "exams_v1"))),
```

### Step 5: Register Admin

In `apps/exams/admin.py`:
- `AttemptAnswerInline` — TabularInline, readonly for review
- `ExamAttemptAdmin` — list_display: user, certification, status, score_percentage, started_at. list_filter: status, certification. readonly_fields: time_remaining_seconds.

### Step 6: Score Calculation Logic

Implement `_calculate_score(attempt)` helper:
```python
def _calculate_score(attempt):
    correct = 0
    for aa in attempt.attempt_answers.prefetch_related('selected_answers', 'question__answers'):
        correct_ids = set(aa.question.answers.filter(is_correct=True).values_list('id', flat=True))
        selected_ids = set(aa.selected_answers.values_list('id', flat=True))
        if correct_ids == selected_ids:
            correct += 1
    return correct
```

### Step 7: Run Migrations

```bash
python manage.py makemigrations exams
python manage.py migrate
```

## API Endpoints

| Method | Path | Auth | Request Body | Response |
|--------|------|------|-------------|----------|
| POST | `/api/v1/exams/start/` | Bearer JWT | `{certification_id: int}` | `{id, certification, started_at, time_limit_minutes, status, total_questions, time_remaining_seconds, questions: [{id, text, question_type, answers: [{id, text}]}]}` |
| PATCH | `/api/v1/exams/{id}/autosave/` | Bearer JWT | `[{question_id, answer_ids: []}]` | `{status: 'saved', time_remaining_seconds: int}` |
| POST | `/api/v1/exams/{id}/submit/` | Bearer JWT | `[{question_id, answer_ids: []}]` (optional) | `{id, score_percentage, correct_count, total_questions, status, submitted_at}` |
| GET | `/api/v1/exams/{id}/review/` | Bearer JWT | — | `{id, certification, score_percentage, correct_count, total_questions, questions: [ReviewSerializer], user_answers: {qid: [aids]}}` |
| GET | `/api/v1/exams/` | Bearer JWT | — | Paginated `[{id, certification, started_at, submitted_at, status, score_percentage, total_questions, correct_count}]` |

## Security Considerations

- **Ownership check**: Every view must verify `attempt.user == request.user`. Return 404 (not 403) to prevent attempt enumeration.
- **Timer integrity**: `time_remaining_seconds` is computed server-side. Client timer is cosmetic only.
- **ExamSerializer on start**: Response must use `QuestionExamSerializer` — NEVER include `is_correct` or `explanation`.
- **ReviewSerializer only after submit**: `review/` endpoint rejects `in_progress` attempts.
- **Expired handling**: If attempt expired on submit, mark as 'expired' but calculate score anyway (user still sees results).
- **Random question selection**: Use `order_by('?')` for PostgreSQL random. For large question banks, consider sampling with `random.sample` on IDs.

## Acceptance Criteria

- ExamAttempt and AttemptAnswer models pass makemigrations + migrate
- POST /api/v1/exams/start/ creates attempt with random questions and returns ExamSerializer data (no is_correct)
- PATCH /api/v1/exams/{id}/autosave/ saves partial answers and returns time_remaining_seconds
- POST /api/v1/exams/{id}/submit/ calculates score correctly
- Submitting after time expired marks attempt as 'expired' and still returns score
- GET /api/v1/exams/{id}/review/ returns ReviewSerializer data (is_correct + explanation visible)
- GET /api/v1/exams/ lists only the authenticated user's attempts (paginated)
- Users cannot access other users' attempts
