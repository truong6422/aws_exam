---
spec_id: phase-05-backend-import
version: "1.0"
status: in-progress
blockedBy:
  - phase-01-backend-question-bank
agents:
  - fullstack-developer
acceptance_criteria:
  - "POST /api/v1/imports/questions/ requires is_staff permission"
  - "Valid JSON import creates questions atomically (all or nothing)"
  - "Invalid JSON schema returns 400 with clear error messages"
  - "Import response includes {imported: N, errors: []}"
  - "Single-answer questions must have exactly 1 is_correct=True"
  - "Multiple-answer questions must have >= 2 is_correct=True"
  - "Non-staff users get 403"
  - "jsonschema library added to requirements"
---

# Phase 05 — Backend: Admin Import Pipeline

## Overview

- **Priority**: P2 (Content pipeline — needed for P8 frontend admin)
- **Depends on**: P1 (Certification, Domain, Question, Answer models)
- **Blocks**: P8 (Frontend Admin Panel)
- **Description**: Staff-only bulk question import via JSON with schema validation. Atomic transaction — all questions import or none do.

## Related Code Files

### Modify
- `apps/backend/apps/imports/views.py` — create BulkQuestionImportView
- `apps/backend/apps/imports/serializers.py` — create import serializer
- `apps/backend/apps/imports/urls.py` — wire endpoint
- `apps/backend/config/urls.py` — add `/api/v1/imports/` prefix
- `apps/backend/requirements/base.txt` (or `requirements.txt`) — add `jsonschema`

### Create
- `apps/backend/apps/imports/validators.py` — JSON schema + business logic validation

### Delete
- None

## Implementation Steps

### Step 1: Add jsonschema Dependency

Add `jsonschema>=4.0,<5.0` to requirements file. Verify install:
```bash
pip install jsonschema
```

### Step 2: Create JSON Schema Validator

In `apps/imports/validators.py`, define `QUESTION_IMPORT_SCHEMA`:

```python
QUESTION_IMPORT_SCHEMA = {
    "type": "object",
    "required": ["certification_code", "domain_name", "questions"],
    "properties": {
        "certification_code": {"type": "string", "minLength": 1},
        "domain_name": {"type": "string", "minLength": 1},
        "questions": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "object",
                "required": ["text", "answers"],
                "properties": {
                    "text": {"type": "string", "minLength": 10},
                    "explanation": {"type": "string"},
                    "source": {"type": "string"},
                    "question_type": {"enum": ["single", "multiple"], "default": "single"},
                    "answers": {
                        "type": "array",
                        "minItems": 2,
                        "items": {
                            "type": "object",
                            "required": ["text", "is_correct"],
                            "properties": {
                                "text": {"type": "string", "minLength": 1},
                                "is_correct": {"type": "boolean"}
                            }
                        }
                    }
                }
            }
        }
    }
}
```

Create `validate_import_data(data)` function:
1. Run `jsonschema.validate(data, QUESTION_IMPORT_SCHEMA)` — catch `ValidationError`
2. Verify `certification_code` exists in DB
3. Verify `domain_name` exists for that certification
4. Business logic: for each question:
   - If `question_type == 'single'`: exactly 1 answer must have `is_correct=True`
   - If `question_type == 'multiple'`: at least 2 answers must have `is_correct=True`
   - Default `question_type` to 'single' if not provided
5. Return `(is_valid: bool, errors: list[str])`

### Step 3: Create Import Serializer

In `apps/imports/serializers.py`:

**BulkQuestionImportSerializer** (Serializer):
- Field: `data` = JSONField() — the entire import payload
- `validate_data`: call `validate_import_data()`, raise `ValidationError` with error list
- `create`: inside `transaction.atomic()`:
  1. Look up Certification by `certification_code`
  2. Look up Domain by `domain_name` + certification
  3. For each question in `data['questions']`:
     - Create `Question` with domain, text, explanation, source, question_type
     - Create `Answer` objects for each answer entry
  4. Return `{imported: count, errors: []}`

### Step 4: Create Import View

In `apps/imports/views.py`:

**BulkQuestionImportView** (generics.CreateAPIView):
- `permission_classes = [IsAuthenticated, IsAdminUser]` (IsAdminUser checks is_staff)
- `serializer_class = BulkQuestionImportSerializer`
- Override `create`:
  - Validate serializer
  - Call `serializer.save()`
  - Return `{imported: N, errors: []}` with status 201

Error handling:
- Schema validation failure → 400 with `{errors: ['Schema: ...']}`
- Certification not found → 400 with `{errors: ['Certification SAA-C03 not found']}`
- Domain not found → 400 with `{errors: ['Domain X not found for certification Y']}`
- DB error → 400 (atomic rollback), return error message

### Step 5: Wire URLs

In `apps/imports/urls.py`:
```
questions/ → BulkQuestionImportView (POST)
```

In `config/urls.py`, add:
```python
path("api/v1/imports/", include(("apps.imports.urls", "imports_v1"))),
```

### Step 6: Example Import JSON

Document the expected format for frontend and testing:
```json
{
  "certification_code": "SAA-C03",
  "domain_name": "Design Secure Architectures",
  "questions": [
    {
      "text": "A company needs to encrypt data at rest in S3. Which approach requires the LEAST operational overhead?",
      "explanation": "SSE-S3 is fully managed by AWS...",
      "source": "AWS Docs - S3 Encryption",
      "question_type": "single",
      "answers": [
        {"text": "SSE-S3", "is_correct": true},
        {"text": "SSE-KMS with customer-managed key", "is_correct": false},
        {"text": "Client-side encryption", "is_correct": false},
        {"text": "SSE-C", "is_correct": false}
      ]
    }
  ]
}
```

## API Endpoints

| Method | Path | Auth | Request Body | Response |
|--------|------|------|-------------|----------|
| POST | `/api/v1/imports/questions/` | Bearer JWT + is_staff | `{certification_code, domain_name, questions: [{text, explanation?, source?, question_type?, answers: [{text, is_correct}]}]}` | `{imported: int, errors: []}` |

**Error responses:**
- 400: `{errors: ['Schema validation: ...', 'Certification not found', ...]}`
- 403: `{detail: 'You do not have permission to perform this action.'}`
- 401: `{detail: 'Authentication credentials were not provided.'}`

## Security Considerations

- **Staff-only**: `IsAdminUser` permission class checks `user.is_staff`. Non-staff users get 403.
- **Atomic transactions**: All questions import or none do. Prevents partial imports on error.
- **Input sanitization**: `jsonschema` validates structure. Text fields stored as-is (Django templates auto-escape on render; React escapes by default).
- **Rate limiting**: Consider adding custom throttle for import endpoint (e.g., 10/hour) to prevent abuse. Use DRF's `ScopedRateThrottle`.
- **File size**: For large imports, consider max body size in Nginx config (default 1MB may be too small).

## Acceptance Criteria

- POST /api/v1/imports/questions/ requires is_staff permission
- Valid JSON import creates questions atomically (all or nothing)
- Invalid JSON schema returns 400 with clear error messages
- Import response includes {imported: N, errors: []}
- Single-answer questions must have exactly 1 is_correct=True
- Multiple-answer questions must have >= 2 is_correct=True
- Non-staff users get 403
- jsonschema library added to requirements
