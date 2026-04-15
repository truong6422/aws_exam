# Code Review Report — Security & Quality
**Date:** 2026-03-22 | **Reviewer:** code-reviewer agent
**Scope:** 8 files — backend security-critical + frontend recently implemented

---

## CRITICAL issues (must fix before deploy)

### 1. `analytics/views.py` — No explicit `permission_classes` declared (LOW RISK BUT WORTH FLAGGING)
- All 3 views (`OverviewView`, `WeakDomainsView`, `HistoryView`) rely on the global `DEFAULT_PERMISSION_CLASSES = [IsAuthenticated]` from DRF settings. This is correct and safe, but the views carry **no visual confirmation** of their auth requirement. If someone ever moves these views to a different project or changes the global default, access becomes anonymous with no local safeguard.
- **Verdict:** Not a bug today, but is one misconfiguration away from a data leak. Explicitly add `permission_classes = [IsAuthenticated]` to each view class for defence-in-depth.

### 2. `exam_views.py` — `_save_answers` does NOT validate that `question_id` belongs to the current attempt
- In `ExamAutosaveView.patch` and `ExamSubmitView.post`, `_save_answers` calls `AttemptAnswer.objects.get_or_create(attempt=attempt, question_id=item['question_id'])`. The `attempt` is correctly scoped to `request.user`, but `question_id` is **user-supplied** and is not checked against the attempt's actual question set.
- An authenticated user can autosave answers for *arbitrary question IDs* (including questions that belong to another certification), creating stray `AttemptAnswer` rows with incorrect `question_id` values that will be included in score calculation via `attempt.attempt_answers.all()`.
- **Fix:** Before `get_or_create`, verify the question_id is in the attempt's allowed set: `attempt.attempt_answers.values_list('question_id', flat=True)`.

---

## HIGH issues (should fix soon)

### 3. `exam_views.py` — `ExamSubmitView` — Division by zero if `total_questions = 0`
- Line: `attempt.score_percentage = round(attempt.correct_count / attempt.total_questions * 100, 2)`
- If a certification is seeded with `total_questions=0` (bad data), this raises `ZeroDivisionError` (HTTP 500 unhandled).
- **Fix:** Guard with `if attempt.total_questions else 0`.

### 4. `exam_store.ts` — `timeRemaining` NOT persisted, but timer is re-synced from backend on autosave only
- The `partialize` config explicitly omits `timeRemaining`. On page reload, `timeRemaining` will be `0` until the first autosave response. If the exam page reads `timeRemaining` before the first sync, the countdown timer shows 0 (triggering a false "time's up" UX).
- The backend `time_remaining_seconds` is the source of truth, but the frontend needs to handle the `0` default state on hydration explicitly (show a loading state, not `0:00`).
- **Fix:** On `initSession`, always fetch from backend first before rendering timer. Alternatively, add a `timeRemainingLoaded: boolean` flag to signal hydration readiness.

### 5. `auth_views.py` — Blacklist Redis TTL fallback of `900` (15 min) for access tokens is misleading
- If `exp` is missing or clock-skewed causing `ttl <= 0`, the fallback is `900` seconds. But the access token lifetime is already 15 min (`ACCESS_TOKEN_LIFETIME = timedelta(minutes=15)`). This fallback is correct by coincidence, but is not explicit.
- Larger risk: if `exp` is missing (`token.get("exp")` returns `None`), `int(None - timestamp())` will raise a `TypeError`. There is no guard on `exp is None`.
- **Fix:** Add `if exp is None: ttl = 900` branch before the arithmetic.

---

## MEDIUM issues (nice to have)

### 6. `analytics/views.py` — `WeakDomainsView` — N+1 on `correct_ids` per answer
- Inside the loop over `qs` (which can be large), each iteration calls `aa.question.answers.filter(is_correct=True).values_list(...)` — a separate DB query per `AttemptAnswer`, even with `prefetch_related('question__answers')`.
- `prefetch_related` pre-loads `question__answers` but the `.filter(is_correct=True)` inside the loop creates a new queryset that bypasses the prefetch cache.
- **Fix:** Change to `[a.id for a in aa.question.answers.all() if a.is_correct]` to use the prefetched result set, eliminating per-row queries.

### 7. `dashboard-page.tsx` — `err.message` may expose raw API error strings to users
- `setError(err.message)` and then rendering `{error}` directly in the DOM. If the API returns a stack trace or internal message in development mode and it leaks to production, this is an info disclosure risk.
- Minor — the backend uses DRF's standard error format, but worth normalising to a user-friendly message.

### 8. `dashboard-page.tsx` — Hardcoded pass threshold `72` with magic number
- Line 107: `Number(item.score) >= 72` — the passing score threshold. The same `72` is in `history-page.tsx` as `PASSING_SCORE = 72`. Dashboard page doesn't use the constant.
- **Fix:** Extract shared constant (e.g., `PASSING_SCORE`) to a shared config file and import it in both pages. Currently it's a magic number in dashboard.

### 9. `history-page.tsx` — Race condition on rapid page clicks
- `load(p)` is not debounced or cancelled. Clicking Prev/Next rapidly can fire multiple in-flight requests. The last to resolve wins, potentially showing stale data.
- Minor UX issue — no cancellation of previous request (`AbortController`).

### 10. `exam_views.py` — `ExamAutosaveView` — Returns 400 on expired exams, but autosave is called on timer tick
- When the timer reaches 0, the frontend likely fires a final autosave → gets a 400 → the store silently swallows it (correct by design). However, the 400 response detail string `'Exam time has expired.'` may cause confusion if the frontend error handling is ever tightened. A `423 Locked` or custom status would be semantically cleaner, but this is a minor concern.

---

## APPROVED files (no issues found)

- **`exams/serializers.py`** — Clean separation. `QuestionExamSerializer` correctly excludes `is_correct` and `explanation`. `ExamAttemptDetailSerializer` fields are safe (no score data during exam). `ExamReviewSerializer` only accessible post-submission (enforced in view). ✅
- **`questions/serializers.py`** — `AnswerExamSerializer` only exposes `id` and `text`. `AnswerReviewSerializer` adds `is_correct` only. Strict field allowlists. ✅
- **`accounts/auth_views.py`** — JWT blacklist logic is sound (Redis-backed, JTI-based, correct TTL derivation for both access and refresh). Login rate-throttled. Register returns tokens immediately (good UX, acceptable security tradeoff). ✅ (minor TTL guard noted in HIGH #5)
- **`analytics-api.ts`** — Types are accurate, match backend response shapes. No `any` casts. URL construction for `certificationId` is safe (number interpolation, no injection risk). ✅
- **`exam-store.ts`** — Ownership check delegated to backend (correct). `syncToBackend` guards on `attemptId` before calling. `partialize` correctly excludes questions to avoid localStorage bloat. Autosave errors silently swallowed (intentional, correct). ✅ (timer hydration edge case noted in HIGH #4)
- **`history-page.tsx`** — Ownership fully server-enforced. Empty state handled. Null `score_percentage` rendered as `—`. Pagination logic is correct (`data.next` null-check for Next button). PASSING_SCORE constant extracted. ✅ (race condition noted in MEDIUM #9)

---

## Summary verdict: **APPROVED WITH NOTES**

Two issues require fixing before production deploy:
1. **CRITICAL #2** — Unsanitised `question_id` in autosave/submit (allows answer injection across questions)
2. **HIGH #5** — Potential `TypeError` in logout if `exp` claim is absent

Remaining issues are low-severity and can be addressed in follow-up iterations.

**File sizes:** All files within the 200-line limit. ✅
**TypeScript:** No `any` casts found in reviewed files. ✅
**DRY/KISS:** Minor duplication of `72` magic number across dashboard/history (MEDIUM #8). ✅ otherwise.
