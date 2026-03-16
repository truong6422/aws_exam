---
spec_id: phase-02-backend-exam-engine
version: "1.0"
status: pending
agents:
  - fullstack-developer
acceptance_criteria:
  - ExamSession, AttemptAnswer models with full schema
  - Exam mode: timed session, single-submission, scored result
  - Practice mode: instant feedback per answer, no timer
  - Session start/submit/result API endpoints
  - Score calculation logic (with partial credit for multi-select)
  - Unit tests coverage ≥ 80%
---

# Phase 02 — Backend: Exam & Practice Engine

**Priority:** High
**Depends on:** Phase 01 (Question Bank)
**Blocks:** Phase 04 (Analytics), Phase 06 (Frontend Exam/Practice)

## Overview

Implement the core session engine. Two modes share the same models but differ in behavior:
- **Exam mode**: fixed question set, timer, submit-all-at-end, scored
- **Practice mode**: question-by-question, instant feedback per answer, no timer

## Key Insights

- A "session" is created when a user starts an exam/practice
- Questions are sampled from the pool at session creation and locked in
- Exam mode: user answers all, submits once → server scores → result
- Practice mode: user submits each answer individually → server responds with correct answer + explanation immediately
- Both modes track per-question answers for history/analytics
- Scoring: 1 point per correct question; for `multiple` type, all correct choices must be selected (no partial credit by default)
- Sessions have a `status`: `in_progress` | `submitted` | `expired`
- Exam sessions have a configurable time limit (default: 90 min for 65 questions)

## Requirements

### Models

**`ExamSession`**
```python
user           # ForeignKey → User
mode           # CharField: 'exam' | 'practice'
status         # CharField: 'in_progress' | 'submitted' | 'expired'
domain         # ForeignKey → Domain (null=True — all domains if null)
tags           # ManyToMany → Tag (optional filter)
question_count # PositiveSmallIntegerField (10, 25, 65)
time_limit_sec # PositiveIntegerField (null=True for practice)
started_at     # DateTimeField(auto_now_add=True)
submitted_at   # DateTimeField(null=True)
expires_at     # DateTimeField(null=True) — started_at + time_limit
score_raw      # PositiveSmallIntegerField(null=True) — correct count
score_pct      # DecimalField(null=True) — score_raw / question_count * 100
passed         # BooleanField(null=True) — score_pct >= pass_threshold
```

**`SessionQuestion`** (ordered list of questions in session)
```python
session        # ForeignKey → ExamSession
question       # ForeignKey → Question
order          # PositiveSmallIntegerField
```

**`AttemptAnswer`**
```python
session        # ForeignKey → ExamSession
question       # ForeignKey → Question
selected_choices # ManyToMany → Choice
is_correct     # BooleanField(null=True) — set on submit
answered_at    # DateTimeField(auto_now=True)
```

### API Endpoints

```
POST /api/exams/sessions/                  Start session (exam or practice)
GET  /api/exams/sessions/                  List user's sessions
GET  /api/exams/sessions/{id}/             Get session detail + questions
POST /api/exams/sessions/{id}/submit/      Submit all answers (exam mode)
POST /api/exams/sessions/{id}/answer/      Submit single answer (practice mode)
GET  /api/exams/sessions/{id}/result/      Get scored result
```

### Business Logic

**Start session** (`POST /api/exams/sessions/`):
- Validate params: `mode`, `question_count`, `domain` (optional), `tags` (optional)
- Sample N questions from pool (filtered by domain/tags if specified)
- Create `ExamSession` + `SessionQuestion` records
- Set `expires_at` if exam mode
- Return session ID + ordered question list (without correct answers exposed)

**Submit answer** (practice mode, `POST /api/exams/sessions/{id}/answer/`):
- Validate session is `in_progress` and mode is `practice`
- Save `AttemptAnswer` with selected choices
- Compute `is_correct` immediately
- Return: `is_correct`, correct choices, explanation
- **Do not expose** `is_correct` flag on choices in exam mode

**Submit exam** (exam mode, `POST /api/exams/sessions/{id}/submit/`):
- Validate session is `in_progress`, mode is `exam`, not expired
- Bulk-create/update `AttemptAnswer` records
- Score all answers, set `score_raw`, `score_pct`, `passed`
- Set `status = 'submitted'`, `submitted_at = now()`
- Trigger analytics update (signal or direct call)
- Return scored result

**Expiry check**: middleware or per-request check; if `now() > expires_at` set `status = 'expired'`

### Pass Threshold
- Default: 72% (AWS standard for most certs)
- Configurable via Django setting `EXAM_PASS_THRESHOLD = 72`

## Architecture

```
apps/exams/
├── models.py          # ExamSession, SessionQuestion, AttemptAnswer
├── serializers.py     # Session, Answer serializers
├── views.py           # SessionViewSet + submit/answer/result actions
├── services.py        # session_start(), score_session(), check_expiry()
├── selectors.py       # get_session_questions(), get_result()
├── signals.py         # post_submit → update analytics
├── admin.py
├── urls.py
└── tests/
    ├── test_services.py
    └── test_views.py
```

## Related Code Files

**Modify:**
- `apps/exams/models.py` — replace stub
- `apps/exams/serializers.py` — expand
- `apps/exams/views.py` — full session lifecycle
- `apps/exams/urls.py` — router + extra actions

**Create:**
- `apps/exams/services.py`
- `apps/exams/selectors.py`
- `apps/exams/signals.py`
- `apps/exams/tests/test_services.py`
- `apps/exams/tests/test_views.py`

## Implementation Steps

1. Define models (`ExamSession`, `SessionQuestion`, `AttemptAnswer`)
2. Generate migrations
3. Write `services.py`:
   - `start_session(user, mode, question_count, domain, tags)`
   - `submit_practice_answer(session, question, choice_ids)`
   - `submit_exam(session, answers_payload)`
   - `score_session(session)` — sets score fields
4. Write `selectors.py`:
   - `get_questions_for_session(session)` — ordered, no answers exposed
   - `get_session_result(session)` — full scored result
5. Write serializers (separate for start/detail/answer/result)
6. Write `views.py` using `@action` decorators on `SessionViewSet`
7. Wire `signals.py`: `post_save` on `ExamSession` status=submitted → analytics
8. Write tests for services (unit) + views (integration)

## Success Criteria

- Start exam → get back N questions (no correct answers)
- Submit exam → get back score + per-question breakdown
- Practice mode → each answer returns correct choices + explanation
- Expired sessions blocked from submission
- All tests pass

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|-----------|
| Question sampling not random enough | 🟡 Medium | Use `order_by('?')` or `random.sample` |
| Multi-select scoring edge cases | 🟡 Medium | Explicit test cases for partial selections |
| Concurrent submission race | 🟢 Low | DB transaction + `select_for_update` on session |
| Exposing correct answers in exam mode | 🔴 High | Separate serializers for exam vs practice |
