---
spec_id: phase-09-integration-tests
version: "1.0"
status: pending
agents:
  - tester
acceptance_criteria:
  - Backend: all critical API flows covered by integration tests
  - Frontend: Playwright E2E tests for exam flow, practice flow, login
  - CI passes with all tests green
  - No flaky tests (deterministic fixtures)
---

# Phase 09 — Integration & E2E Tests

**Priority:** High
**Depends on:** Phase 06, 07, 08 (all frontend wired), all backend phases
**Blocks:** Phase 10 (Deploy)

## Overview

Validate the full stack end-to-end. Backend integration tests run against a real test database. Frontend E2E tests use Playwright against a running dev stack.

## Key Insights

- Backend already has pytest + factory-boy setup — extend it
- Frontend has no tests yet — introduce Playwright for critical flows only (YAGNI)
- Focus on happy-path E2E + critical failure cases (expired token, wrong password, etc.)
- Use fixtures and factories for deterministic, non-flaky tests
- CI (`docker-compose.test.yml`) already exists — tests run in containers

## Requirements

### Backend Integration Tests

**Auth flow** (`apps/accounts/tests/`)
- Register → tokens returned
- Login → tokens returned
- Login with wrong password → 401
- `GET /me/` with valid token → user profile
- `GET /me/` without token → 401
- Password change → old token invalid

**Question Bank** (`apps/questions/tests/`)
- List questions (authenticated)
- Filter by domain
- Filter by difficulty
- Admin create question with choices
- Non-admin create → 403

**Exam Engine** (`apps/exams/tests/`)
- Start exam session → get N questions (no `is_correct` in response)
- Submit exam answers → get scored result
- Submit expired session → 400/403
- Start practice session → submit answer → get correct choices + explanation
- Cannot see correct answers in exam mode questions endpoint

**Analytics** (`apps/analytics/tests/`)
- After exam submission → analytics updated
- `GET /analytics/summary/` returns correct aggregates
- `GET /analytics/history/` returns paginated sessions

**Import** (`apps/imports/tests/`)
- Upload valid CSV → job created, questions imported
- Upload invalid CSV (bad rows) → error log populated
- Non-admin upload → 403

### Frontend E2E Tests (Playwright)

**Test files:**

```
apps/frontend/e2e/
├── auth.spec.ts        # Login, register, logout
├── exam-flow.spec.ts   # Setup → session → result
├── practice-flow.spec.ts # Setup → per-question feedback
└── admin-import.spec.ts  # Upload CSV → verify job status
```

**Critical flows to cover:**

1. **Login** — valid credentials → dashboard redirect
2. **Register** — new user → dashboard with empty state
3. **Exam flow** — setup (10q) → answer all → submit → result page with score
4. **Practice flow** — setup → answer 1 question → see feedback → next
5. **Admin import** — upload valid CSV → status shows "done"

### Test Infrastructure

- Backend: `pytest-django`, `factory-boy` factories in `conftest.py`
- Frontend: Playwright `@playwright/test`, `playwright.config.ts`
- Fixtures:
  - `UserFactory`, `QuestionFactory`, `ChoiceFactory`, `DomainFactory`
  - 50-question seed fixture for E2E tests
- CI: `docker-compose.test.yml` runs backend tests + Playwright headless

## Architecture

```
apps/backend/
├── conftest.py               # Shared fixtures (factories, api_client)
└── apps/*/tests/             # Per-app test files (already structured)

apps/frontend/
├── playwright.config.ts      # Playwright config (baseURL, browsers)
└── e2e/
    ├── auth.spec.ts
    ├── exam-flow.spec.ts
    ├── practice-flow.spec.ts
    └── admin-import.spec.ts
```

## Implementation Steps

1. **Backend**:
   - Expand `conftest.py` with `QuestionFactory`, `ChoiceFactory`, `DomainFactory`, `ExamSessionFactory`
   - Write missing test files for each app (already scaffolded in phases 1–5)
   - Ensure all tests are isolated (use `@pytest.mark.django_db`)
   - Run full suite: `make test-backend`

2. **Frontend**:
   - Add Playwright: `npm install -D @playwright/test`
   - Write `playwright.config.ts` (baseURL: `http://localhost:5173`, 3 browsers optional → just chromium for CI)
   - Write E2E specs (use `page.getByRole`, `page.getByTestId` — add `data-testid` to key elements as needed)
   - Add Makefile target: `make test-e2e`
   - Run: `npx playwright test`

3. **CI validation**:
   - Verify `docker-compose.test.yml` runs both backend + frontend tests
   - Fix any flaky tests

## Success Criteria

- `make test-backend` → all green, coverage ≥ 75% overall
- `npx playwright test` → all 5 E2E specs pass
- No skipped tests, no `# noqa` hacks on test files
- CI `docker-compose.test.yml` completes without errors

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|-----------|
| E2E tests flaky on timing | 🟡 Medium | Use `waitForResponse` + proper assertions, avoid `sleep` |
| Playwright setup in CI | 🟡 Medium | Use official Playwright Docker image |
| Backend tests coupling to DB state | 🟢 Low | Wrap each test in transaction rollback (pytest-django default) |
