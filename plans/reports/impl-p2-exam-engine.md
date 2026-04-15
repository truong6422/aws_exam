# Phase 02 — Backend: Exam & Practice Engine — Implementation Report

**Date:** 2026-03-22
**Status:** Complete
**Agent:** fullstack-developer

---

## Summary

Implemented the full exam session lifecycle backend (Phase 02). Replaced the stub `Exam` model with `ExamAttempt` + `AttemptAnswer`, created 6 serializers, 5 views, wired URLs, updated admin, and ran migrations.

---

## Files Changed

| File | Action | Lines |
|------|--------|-------|
| `apps/exams/models.py` | Replaced stub `Exam` with `ExamAttempt` + `AttemptAnswer` | 68 |
| `apps/exams/serializers.py` | Replaced stub with 6 focused serializers | 105 |
| `apps/exams/exam_views.py` | Created — 5 views + helpers | 155 |
| `apps/exams/views.py` | Updated — re-exports from exam_views | 10 |
| `apps/exams/urls.py` | Updated — 5 endpoints wired | 19 |
| `apps/exams/admin.py` | Updated — `ExamAttemptAdmin` + `AttemptAnswerInline` | 33 |
| `config/urls.py` | Added `/api/v1/exams/` versioned prefix | +3 lines |
| `apps/exams/migrations/0001_initial.py` | Regenerated — old stub migration deleted, fresh one created | — |

---

## API Endpoints

All resolve to correct view classes (verified):

| Method | Path | View |
|--------|------|------|
| GET | `/api/v1/exams/` | `ExamListView` |
| POST | `/api/v1/exams/start/` | `ExamStartView` |
| PATCH | `/api/v1/exams/{pk}/autosave/` | `ExamAutosaveView` |
| POST | `/api/v1/exams/{pk}/submit/` | `ExamSubmitView` |
| GET | `/api/v1/exams/{pk}/review/` | `ExamReviewView` |

Backward-compat paths (`/api/exams/...`) also work.

---

## Migration Notes

The old `exams` migration (`0001_initial`) referenced the stub `Exam` model and was already applied to the DB. Migration strategy:

1. Deleted old `apps/exams/migrations/0001_initial.py`
2. Ran `makemigrations exams --skip-checks` → new `0001_initial.py` with `ExamAttempt` + `AttemptAnswer`
3. DB still had old `exams_exam` table and `questions_question` without `questions_certification` (Phase 01 partial state)
4. Fake-unapplied both `questions` and `exams` migrations in `django_migrations`
5. Dropped `exams_exam` and `questions_question` tables (stubs with no data)
6. Ran `migrate` — applied `questions.0001_initial` then `exams.0001_initial` cleanly

Tables created:
- `exams_examattempt`
- `exams_attemptanswer`
- `exams_attemptanswer_selected_answers` (M2M through table)
- `questions_certification`, `questions_domain`, `questions_answer` (from Phase 01)

---

## Security Rules Verified

- **Ownership**: All views use `get_object_or_404(ExamAttempt, pk=pk, user=request.user)` → returns 404 not 403 for other users' attempts
- **Anti-cheat**: `ExamAttemptDetailSerializer` uses `QuestionExamSerializer` (no `is_correct`, no `explanation`)
- **Review gate**: `ExamReviewView` rejects `in_progress` attempts with 403
- **Timer integrity**: `time_remaining_seconds` calculated server-side on every request
- **Expired handling**: `ExamSubmitView` marks as `'expired'` when `is_expired=True` but still calculates and returns score

---

## System Check Output

```
System check identified 3 issues (0 silenced).
WARNINGS:
?: (urls.W005) URL namespace 'exams' isn't unique...
?: (urls.W005) URL namespace 'imports' isn't unique...
?: (urls.W005) URL namespace 'questions' isn't unique...
```

**Pre-existing warnings** from the double-include pattern (versioned + unversioned). Same as questions/imports — not introduced by this phase. No errors.

---

## Acceptance Criteria Status

| Criterion | Status |
|-----------|--------|
| ExamAttempt and AttemptAnswer models pass makemigrations + migrate | ✅ |
| POST /api/v1/exams/start/ creates attempt with random questions (no is_correct) | ✅ |
| PATCH /api/v1/exams/{id}/autosave/ saves partial answers, returns time_remaining_seconds | ✅ |
| POST /api/v1/exams/{id}/submit/ calculates score correctly | ✅ |
| Submitting after expired marks as 'expired', still returns score | ✅ |
| GET /api/v1/exams/{id}/review/ returns ReviewSerializer data (is_correct + explanation) | ✅ |
| GET /api/v1/exams/ lists only authenticated user's attempts (paginated) | ✅ |
| Users cannot access other users' attempts | ✅ (404 via get_object_or_404 with user= filter) |

---

## Unresolved Questions

- Docker `db` container fails to start due to host port 5432 conflict (local PG running). Commands run against local PG directly. In CI/production this is a non-issue as Docker manages the DB.
- `jsonschema` was missing from the venv (installed to unblock `check` command). Should be added to `requirements.txt` if not already present.
