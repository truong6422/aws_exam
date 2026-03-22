---
spec_id: phase-09-integration-tests
version: "1.0"
status: completed
blockedBy: []
agents:
  - fullstack-developer
acceptance_criteria:
  - "test_serializer_security: GET exam questions response does NOT contain is_correct or explanation fields"
  - "test_timer_validation: submitting expired exam returns score with status='expired'"
  - "test_autosave: PATCH autosave saves answers that appear in final submit result"
  - "test_jwt_blacklist: POST logout then reuse access token returns 401"
  - "test_import_validation: invalid JSON schema returns 400 with descriptive errors"
  - "exam-store.test.ts: Zustand actions update state correctly and persist to localStorage"
  - "question-navigation-grid.test.tsx: all 4 color states render correctly"
  - "exam-timer.test.ts: countdown decrements and calls onTimeUp at zero"
  - "All backend tests pass with pytest"
  - "All frontend tests pass with vitest"
---

# Phase 09 — Integration & Security Tests

## Overview

- **Priority**: P1 (Quality gate before deploy)
- **Depends on**: P6, P7, P8 (all features must be implemented)
- **Blocks**: P10 (Deploy)
- **Description**: Verify critical security behaviors and functional flows. Backend tests via pytest + Django test client. Frontend tests via Vitest + React Testing Library.

## Related Code Files

### Create (Backend Tests)
- `apps/backend/apps/exams/tests/test_serializer_security.py`
- `apps/backend/apps/exams/tests/test_timer_validation.py`
- `apps/backend/apps/exams/tests/test_autosave.py`
- `apps/backend/apps/accounts/tests/test_jwt_blacklist.py`
- `apps/backend/apps/imports/tests/test_import_validation.py`

### Create (Frontend Tests)
- `apps/frontend/src/stores/__tests__/exam-store.test.ts`
- `apps/frontend/src/components/exam/__tests__/question-navigation-grid.test.tsx`
- `apps/frontend/src/hooks/__tests__/exam-timer.test.ts`

### Create (Supporting)
- `apps/backend/apps/exams/tests/__init__.py`
- `apps/backend/apps/exams/tests/conftest.py` — shared fixtures
- `apps/backend/apps/accounts/tests/__init__.py`
- `apps/backend/apps/imports/tests/__init__.py`

### Delete
- None

## Implementation Steps

### Step 1: Backend Test Fixtures

Create `apps/exams/tests/conftest.py` with pytest fixtures:

```python
@pytest.fixture
def user(db):
    """Create a regular test user."""

@pytest.fixture
def staff_user(db):
    """Create a staff user for admin tests."""

@pytest.fixture
def certification(db):
    """Create SAA-C03 certification with domains."""

@pytest.fixture
def questions(db, certification):
    """Create 10 questions with answers for testing."""

@pytest.fixture
def auth_client(user):
    """Return APIClient with JWT auth headers."""

@pytest.fixture
def exam_attempt(auth_client, certification, questions):
    """Create an in_progress exam attempt via API."""
```

### Step 2: test_serializer_security.py

**Critical test — verifies is_correct is never leaked during exam.**

```
Test 1: Start exam → check response questions → assert 'is_correct' NOT in any answer
Test 2: Start exam → check response questions → assert 'explanation' NOT in any question
Test 3: GET review (after submit) → assert 'is_correct' IS in answers
Test 4: GET review (after submit) → assert 'explanation' IS in questions
Test 5: GET review on in_progress attempt → assert 403 or 400
```

Implementation:
- POST `/api/v1/exams/start/` → parse response JSON
- Iterate `response['questions']` → iterate `question['answers']`
- `assert 'is_correct' not in answer` for each answer
- `assert 'explanation' not in question` for each question
- Submit exam → GET `/api/v1/exams/{id}/review/`
- `assert 'is_correct' in answer` for each answer

### Step 3: test_timer_validation.py

**Verifies server-side timer enforcement.**

```
Test 1: Create attempt → manually set started_at to (now - time_limit - 1min) → submit → assert status='expired'
Test 2: Create attempt → submit within time → assert status='submitted'
Test 3: Create attempt → let expire → autosave → assert error response
Test 4: Expired attempt still returns score_percentage (not rejected)
```

Implementation:
- Use `ExamAttempt.objects.filter(id=attempt_id).update(started_at=past_time)` to simulate expiry
- Submit via API → check response status field
- Verify score is still calculated even for expired attempts

### Step 4: test_autosave.py

**Verifies autosave persists and reflects in final result.**

```
Test 1: Start exam → autosave answers for 3 questions → submit → verify those 3 answers in result
Test 2: Autosave → autosave again (overwrite) → submit → verify latest answers used
Test 3: Autosave returns time_remaining_seconds > 0
Test 4: Autosave with invalid question_id → assert 400
Test 5: Autosave other user's attempt → assert 404
```

Implementation:
- POST start → PATCH autosave with `[{question_id, answer_ids}]`
- POST submit → GET review → compare saved answers with submitted answers
- Verify `response['time_remaining_seconds']` is reasonable number

### Step 5: test_jwt_blacklist.py

**Verifies logout actually invalidates tokens.**

```
Test 1: Login → get token → logout → use same token → assert 401
Test 2: Login → get token → use token (200) → logout → use token (401)
Test 3: Login → logout → login again → new token works (200)
Test 4: Logout with invalid/missing token → graceful handling
```

Implementation:
- POST `/api/v1/auth/login/` → save access token
- POST `/api/v1/auth/logout/` with auth header
- GET `/api/v1/auth/me/` with same access token → assert 401
- Verify Redis key exists: `cache.get(f'token:blacklist:{jti}')` is truthy

### Step 6: test_import_validation.py

**Verifies JSON schema validation and staff-only access.**

```
Test 1: Valid JSON import → assert 201 with {imported: N}
Test 2: Missing certification_code → assert 400
Test 3: Missing questions array → assert 400
Test 4: Question text too short (<10 chars) → assert 400
Test 5: Less than 2 answers → assert 400
Test 6: Non-existent certification_code → assert 400
Test 7: Non-staff user → assert 403
Test 8: Unauthenticated → assert 401
Test 9: Single-type question with 2 correct answers → assert 400
Test 10: Atomic rollback — 5 valid + 1 invalid in batch → assert 0 created
```

### Step 7: Frontend — exam-store.test.ts

Test Zustand store actions:

```
Test 1: initSession sets all state fields correctly
Test 2: updateAnswer adds answer to answers map
Test 3: updateAnswer overwrites previous answer for same question
Test 4: toggleFlag adds question to flagged set
Test 5: toggleFlag removes question if already flagged
Test 6: clearSession resets all fields
Test 7: persist middleware saves answers to localStorage
Test 8: persist middleware restores answers on store rehydration
```

Use `zustand` testing pattern: create store in beforeEach, reset between tests.

### Step 8: Frontend — question-navigation-grid.test.tsx

Test visual states with React Testing Library:

```
Test 1: Unanswered question renders with gray background class
Test 2: Answered question renders with green background class
Test 3: Flagged question renders with orange background class
Test 4: Answered + flagged question renders with yellow background class
Test 5: Current question has ring-2 class
Test 6: Clicking grid button calls onSelectQuestion with correct index
Test 7: Grid renders correct number of buttons
```

Use `render()` + `screen.getByText()` + `expect(el).toHaveClass()`.

### Step 9: Frontend — exam-timer.test.ts

Test timer hook behavior:

```
Test 1: Hook returns correct initial minutes and seconds
Test 2: After 1 tick, seconds decrease by 1
Test 3: onTimeUp called when time reaches 0
Test 4: isWarning true when time < 300
Test 5: isCritical true when time < 60
```

Use `@testing-library/react-hooks` or `renderHook()`. Use `vi.useFakeTimers()` to control time.

### Step 10: Run All Tests

Backend:
```bash
cd apps/backend && pytest -v --tb=short
```

Frontend:
```bash
cd apps/frontend && npx vitest run --reporter=verbose
```

## Security Considerations

- **Serializer security test is the most critical**: If `is_correct` leaks during exam mode, the entire product is compromised. This test must never be skipped.
- **JWT blacklist test validates auth integrity**: Ensures logout actually works.
- **Import validation prevents data corruption**: Invalid questions in DB would break exam scoring.
- **Test isolation**: Each test creates its own data. Use `pytest.mark.django_db` for DB access. Use `transaction=True` where atomic behavior is tested.

## Acceptance Criteria

- test_serializer_security: GET exam questions response does NOT contain is_correct or explanation fields
- test_timer_validation: submitting expired exam returns score with status='expired'
- test_autosave: PATCH autosave saves answers that appear in final submit result
- test_jwt_blacklist: POST logout then reuse access token returns 401
- test_import_validation: invalid JSON schema returns 400 with descriptive errors
- exam-store.test.ts: Zustand actions update state correctly and persist to localStorage
- question-navigation-grid.test.tsx: all 4 color states render correctly
- exam-timer.test.ts: countdown decrements and calls onTimeUp at zero
- All backend tests pass with pytest
- All frontend tests pass with vitest
