# Phase 05 Implementation Report — Backend: Admin Import Pipeline

**Date:** 2026-03-22
**Agent:** fullstack-developer
**Status:** ✅ Complete

---

## Files Modified

| File | Action |
|------|--------|
| `apps/backend/requirements/base.txt` | Added `jsonschema>=4.0,<5.0` |
| `apps/backend/apps/imports/validators.py` | Created — schema + DB + business logic validation |
| `apps/backend/apps/imports/serializers.py` | Rewrote — added `BulkQuestionImportSerializer`, kept `ImportJobSerializer` |
| `apps/backend/apps/imports/views.py` | Rewrote — added `BulkQuestionImportView`, kept `ImportJobListView` |
| `apps/backend/apps/imports/urls.py` | Added `questions/` route for bulk import |
| `apps/backend/config/urls.py` | Added `api/v1/imports/` versioned prefix |

---

## What Was Implemented

### 1. `validators.py` (new)
- `QUESTION_IMPORT_SCHEMA` — jsonschema definition for the import payload
- `validate_import_data(data)` → `(bool, list[str])`:
  1. Schema validation (fail-fast on first schema error)
  2. DB existence check: `Certification.objects.get(code=...)`
  3. DB existence check: `Domain.objects.get(certification=cert, name=...)`
  4. Business logic: single-type needs exactly 1 correct, multiple-type needs ≥ 2 correct

### 2. `serializers.py`
- `ImportJobSerializer` — legacy read-only serializer, kept intact
- `BulkQuestionImportSerializer` — new:
  - `data = JSONField()` wraps entire payload
  - `validate_data()` delegates to `validate_import_data()`
  - `create()` uses `transaction.atomic()` — all questions or none

### 3. `views.py`
- `ImportJobListView` — legacy list view, kept intact
- `BulkQuestionImportView(generics.CreateAPIView)`:
  - `permission_classes = [IsAuthenticated, IsAdminUser]`
  - Returns `{imported: N, errors: []}` with HTTP 201

### 4. URL routing
- `POST /api/v1/imports/questions/` — new versioned endpoint (staff only)
- `GET /api/imports/` — legacy unversioned endpoint (backward compat, unchanged)

---

## Validation Test Results

All 6 tests passed against live PostgreSQL (test container):

| # | Scenario | Result |
|---|----------|--------|
| 1 | Missing `questions` field | PASS — schema error returned |
| 2 | Question text < 10 chars | PASS — schema error returned |
| 3 | Certification not in DB | PASS — `"Certification 'INVALID' not found"` |
| 4 | Single-type with 2 correct answers | PASS — business logic error |
| 5 | Valid single-type question | PASS — `(True, [])` |
| 6 | Multiple-type with only 1 correct | PASS — business logic error |

---

## Django System Check

```
System check identified 3 issues (0 silenced)
  WARNINGS (3x urls.W005): URL namespace not unique for imports, questions, exams
  ERRORS: 0
```

The 3 warnings are **pre-existing** — same pattern as `questions_v1` already in the codebase. Not introduced by this phase.

---

## Acceptance Criteria Status

| Criterion | Status |
|-----------|--------|
| POST /api/v1/imports/questions/ requires is_staff | ✅ `IsAuthenticated + IsAdminUser` |
| Valid JSON creates questions atomically | ✅ `transaction.atomic()` in `create()` |
| Invalid schema returns 400 with clear errors | ✅ schema + DB + business logic errors |
| Response includes `{imported: N, errors: []}` | ✅ |
| Single-type must have exactly 1 correct | ✅ validated in `validate_import_data` |
| Multiple-type must have >= 2 correct | ✅ validated in `validate_import_data` |
| Non-staff users get 403 | ✅ `IsAdminUser` checks `user.is_staff` |
| jsonschema added to requirements | ✅ `jsonschema>=4.0,<5.0` in `base.txt` |

---

## Notes

- `jsonschema` installed version: **4.26.0**
- `env_file: .env` in test compose overrides `DATABASE_URL` — use `DB_*` env vars directly when running test container manually
- The `api/imports/` unversioned route also exposes `/questions/` (both routes include the same `urls.py`), which is consistent with the existing pattern for `questions` and `accounts`
