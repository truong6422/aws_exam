# Code Review: Practice Question Tracking

**Date:** 2026-04-22
**Reviewer:** code-reviewer agent
**Plan:** plans/260422-1204-practice-questions-tracking/
**Scope:** 11 files — backend model/view/migration/admin + frontend page/service/i18n

---

## Scope

- **Files reviewed:** 11
- **Backend LOC changed:** ~60 (model: 20, view: 15, migration: 20, admin: 5)
- **Frontend LOC changed:** ~40 (practice page: 5, exam-api: 10, admin-api: 3, dashboard: 5, i18n: 2)
- **Focus:** New `PracticeQuestionView` model, `PracticeViewedView` endpoint, dashboard stat aggregation, frontend fire-and-forget call

---

## Overall Assessment

Solid, minimal feature. The model and migration are correct, the frontend integration is clean, and the fire-and-forget pattern is appropriate for a non-critical tracking call. One confirmed Critical bug (unhandled `ValueError` → HTTP 500 from non-integer `question_id`) requires a one-line fix before merge. Three Low issues are advisory.

---

## Critical Issues

### 1. `question_id` type validation missing — unhandled 500 on bad input

**File:** `apps/backend/apps/questions/views.py`, `PracticeViewedView.post()`

**Confirmed by live test:**
```
$ python3 -c "get_object_or_404(Question, pk='abc')"
ValueError: Field 'id' expected a number but got 'abc'.
```
DRF's `exception_handler` returns `None` for `ValueError`; the custom handler at `core/exceptions/handlers.py` also only processes `Http404` + DRF exceptions. Result: Django propagates an **HTTP 500** to the caller.

The `question_id` check on line 268 only guards for missing/falsy values. It does not guard against non-integer strings (`"abc"`, `"1; DROP TABLE..."`, floats like `"1.5"`).

**Impact:** Any authenticated user can trigger a 500 by sending `{"question_id": "abc"}`. In production this logs a full traceback and may expose stack details if `DEBUG` is accidentally true. This is low severity from an exploitability standpoint (auth-gated, no data leak), but it violates the input validation rule and the correctness bar.

**Fix — one line:**
```python
def post(self, request):
    question_id = request.data.get("question_id")
    if not question_id:
        return Response({"detail": "question_id required."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        question_id = int(question_id)
    except (TypeError, ValueError):
        return Response({"detail": "question_id must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
    question = get_object_or_404(Question, pk=question_id)
    ...
```

Alternatively, remove body parameter entirely and use a URL path param `<int:question_id>` — consistent with all other question-scoped views in this file (`BookmarkToggleView`, `CommentListCreateView`, etc.).

---

## High Priority

### 2. Unnecessary DB query on every tracked view

**File:** `apps/backend/apps/questions/views.py`, lines 275–276

```python
total = PracticeQuestionView.objects.filter(user=request.user).count()
return Response({"created": created, "total_practice_views": total})
```

The frontend discards `total_practice_views` entirely — it `.catch(() => {})` and ignores the resolved value. This count query runs on every reveal, adding an extra DB round-trip with no consumer.

**Fix:** Remove the count query and return only `{"created": created}`. If the total is ever needed client-side in future, it can be added back with intent.

```python
_, created = PracticeQuestionView.objects.get_or_create(
    user=request.user, question=question
)
return Response({"created": created}, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)
```

Also consider returning `201 Created` vs `200 OK` to differentiate first-view from re-view. Currently both return 200.

---

## Medium Priority

### 3. `total_questions_done` metric is a mixed, non-comparable aggregate

**File:** `apps/backend/apps/accounts/admin_views.py`, line 57

```python
"total_questions_done": total_exam_answers + total_practice_views,
```

- `AttemptAnswer.objects.count()` = rows in the `AttemptAnswer` table. Since `unique_together = ('attempt', 'question')`, this counts one row per question _per attempt_, not per unique question. A user who retakes the same exam 5 times contributes 65×5 = 325 rows.
- `PracticeQuestionView.objects.count()` = unique user+question pairs across all users.

Adding these together yields a number that is semantically incoherent: exam side overcounts retakes, practice side deduplicates. The label "Total Questions Done" is ambiguous to an admin reading it.

**This is not a bug** if the intent is "total activity events" rather than "unique questions seen." But the naming suggests the latter. Recommend either:

a) Rename to `total_activity_events` in the API response and dashboard label, or
b) Make both sides consistent: `AttemptAnswer.objects.values('question').distinct().count()` for unique exam questions.

No code change is strictly required, but the label should be corrected in `en.json` / `vi.json` if "activity events" is the intended meaning.

---

## Low Priority

### 4. `unique_together` vs `UniqueConstraint`

**File:** `apps/backend/apps/questions/models.py`, line 225

```python
class Meta:
    unique_together = ("user", "question")
```

Django 4.2+ deprecates `unique_together` in favor of `UniqueConstraint` in `Meta.constraints`. This works and the migration is valid, but for consistency with the project's future Django upgrades:

```python
class Meta:
    constraints = [
        models.UniqueConstraint(fields=["user", "question"], name="unique_practice_view_per_user")
    ]
```

Not blocking — `unique_together` still functions in Django 6.0 (used here per migration comment). Consistent with how existing models (`Bookmark`, `AnswerReport`, `ExamSet`) use `unique_together`, so no immediate inconsistency.

### 5. `related_name="practice_views"` on both FKs — correct, no conflict

**File:** `apps/backend/apps/questions/models.py`, lines 214–221

The reviewer's concern is unfounded. `user.practice_views` and `question.practice_views` point to different models (`AUTH_USER_MODEL` and `Question` respectively) so there is no `related_name` conflict. Django resolves these against their respective target models. Confirmed correct.

### 6. Fire-and-forget auth expiry behavior is acceptable

**File:** `apps/frontend/src/pages/practice/practice-session-page.tsx`, lines 54–57

```typescript
if (isAuthenticated) {
  practiceApi.markQuestionViewed(question.id).catch(() => {})
}
```

If auth expires mid-session, the API returns 401 and the `.catch(() => {})` silently discards it. This is correct for a non-critical tracking call. The user's practice flow is unaffected. The `isAuthenticated` guard prevents firing for guests. No issue.

---

## Positive Observations

- Model design is clean and minimal — `viewed_at` timestamp is useful for future analytics without over-engineering.
- `get_or_create` is the correct pattern for idempotent view tracking.
- URL ordering is correct: `practice/viewed/` is declared before `<int:question_id>/...` patterns, so no routing ambiguity.
- Frontend `question.id` is always a `number` (typed as `ReviewQuestion.id: number`), so the value passed to `markQuestionViewed` is always valid at runtime — the 500 is only exploitable via direct API calls, not through normal UI.
- Migration is auto-generated and correct; no manual edits.
- i18n keys present in both `en.json` and `vi.json` at the correct nesting level under `admin`.
- `IsAuthenticated` guard on the endpoint is correct — no unauthenticated tracking.

---

## Recommended Actions (priority order)

1. **[Must fix]** Add `int()` cast + `ValueError` guard to `PracticeViewedView.post()` before the `get_object_or_404` call.
2. **[Should fix]** Remove the `total` count query and the `total_practice_views` field from the response.
3. **[Should clarify]** Decide on the semantic of `total_questions_done` — rename to `total_activity_events` or make both sides count unique questions consistently.
4. **[Optional]** Migrate `unique_together` → `UniqueConstraint` in `PracticeQuestionView.Meta` when modernizing other models.

---

## Scoring (LLM-as-Judge)

| Criterion | Score | Evidence |
|-----------|-------|----------|
| Correctness | 5 | Non-integer `question_id` causes unhandled `ValueError` → HTTP 500, confirmed by live test. Custom exception handler does not catch `ValueError`. |
| Security | 7 | Auth-gated endpoint, no secret exposure, no injection possible (ORM used). The 500 path is low-exploitability (auth required, no data leak). Minor hardening gap. |
| Maintainability | 8 | Clean, readable code. Minor: `total_questions_done` metric naming is ambiguous. Unnecessary `total` query adds noise. |
| Performance | 8 | One wasted DB count query per tracked view. Otherwise efficient: `get_or_create` uses the `unique_together` index. `dashboard_stats` does 6 count queries with no N+1. |
| Test Coverage | 5 | No tests provided for the new endpoint (happy path, 400 on missing id, 400 on non-integer id, deduplication behavior). No tests for dashboard stat aggregation change. |
| Code Style | 9 | Consistent with codebase conventions. Clean TypeScript types. Good comments. |
| **Weighted Total** | **6.65** | **REJECT** |

**Calculation:** 5×0.25 + 7×0.25 + 8×0.20 + 8×0.15 + 5×0.10 + 9×0.05 = 1.25 + 1.75 + 1.60 + 1.20 + 0.50 + 0.45 = **6.75**

---

## Verdict

**REJECT — 1 must-fix issue before merge.**

| # | Criterion | Score | Blocking Issue |
|---|-----------|-------|----------------|
| 1 | Correctness | 5 | `PracticeViewedView.post()` has no integer validation on `question_id` — passing `"abc"` raises `ValueError` unhandled by DRF/custom handler → HTTP 500. Fix: add `int()` cast with `try/except` returning 400. |

After fixing issue #1, re-score is estimated at 8.0+ (PASS). Issues #2 and #3 are advisory improvements, not blockers.

---

## Unresolved Questions

1. Is `total_questions_done` intended to mean "total activity events" (current behavior) or "total unique questions ever seen" (what the label implies)? This determines whether AttemptAnswer should be deduplicated.
2. Should `PracticeViewedView` return `201 Created` on first view and `200 OK` on re-view, or is uniform `200 OK` intentional?
