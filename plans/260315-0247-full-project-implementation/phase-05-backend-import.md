---
spec_id: phase-05-backend-import
version: "1.0"
status: pending
agents:
  - fullstack-developer
acceptance_criteria:
  - CSV and JSON import formats documented and working
  - ImportJob model tracks status/progress
  - Celery async processing for large files
  - Validation errors reported per-row (not fail-all)
  - Admin-only access enforced
  - Unit tests for parser + views
---

# Phase 05 — Backend: Admin Import Pipeline

**Priority:** Medium
**Depends on:** Phase 01 (Question Bank models exist)
**Blocks:** Phase 08 (Frontend Admin panel)

## Overview

Allow admins to bulk-upload questions via CSV or JSON file. Processing happens async via Celery. The existing `imports` app has stubs — expand into a working pipeline.

## Key Insights

- Admins need to seed the question bank (100–1000+ questions)
- Manual creation via Django admin is impractical at scale
- CSV format: easy to prepare in Excel/Sheets; JSON: easier for programmatic export
- Validation errors should be reported per-row so admins can fix and re-upload
- Large files (500+ questions) block the request — use Celery
- Import job tracks: file, status, rows_processed, rows_failed, error_log

## Requirements

### Model (expand `ImportJob` stub)

**`ImportJob`**
```python
uploaded_by      # ForeignKey → User
file             # FileField (upload_to='imports/')
file_format      # CharField: 'csv' | 'json'
status           # CharField: 'pending' | 'processing' | 'done' | 'failed'
rows_total       # PositiveIntegerField(null=True)
rows_processed   # PositiveIntegerField(default=0)
rows_failed      # PositiveIntegerField(default=0)
error_log        # JSONField(default=list)  [{row, error_message}]
started_at       # DateTimeField(null=True)
completed_at     # DateTimeField(null=True)
```

### CSV Format

```csv
stem,question_type,domain,tags,difficulty,explanation,choice_1,correct_1,choice_2,correct_2,...
"What is S3?",single,S3,"SAA-C03,storage",easy,"S3 is object storage",Object storage,true,Block storage,false,...
```

### JSON Format

```json
[{
  "stem": "What is S3?",
  "question_type": "single",
  "domain": "S3",
  "tags": ["SAA-C03", "storage"],
  "difficulty": "easy",
  "explanation": "S3 is object storage",
  "choices": [
    {"text": "Object storage", "is_correct": true},
    {"text": "Block storage", "is_correct": false}
  ]
}]
```

### API Endpoints

```
POST /api/imports/           Upload file → create ImportJob → queue Celery task
GET  /api/imports/           List import jobs (admin only)
GET  /api/imports/{id}/      Get job status + error log
```

### Permissions
- All endpoints: `IsAdminUser`

## Architecture

```
apps/imports/
├── models.py       # ImportJob (expand stub)
├── serializers.py  # ImportJobSerializer, ImportJobCreateSerializer
├── views.py        # ImportJobViewSet
├── parsers/
│   ├── __init__.py
│   ├── csv_parser.py   # parse CSV → list of question dicts
│   └── json_parser.py  # parse JSON → list of question dicts
├── services.py     # process_import_job(job_id)
├── tasks.py        # run_import_job Celery task
├── validators.py   # per-row validation
├── urls.py
└── tests/
    ├── test_parsers.py
    ├── test_services.py
    └── test_views.py
```

## Related Code Files

**Modify:**
- `apps/imports/models.py` — expand stub
- `apps/imports/serializers.py` — expand
- `apps/imports/views.py` — expand
- `apps/imports/urls.py`

**Create:**
- `apps/imports/parsers/csv_parser.py`
- `apps/imports/parsers/json_parser.py`
- `apps/imports/validators.py`
- `apps/imports/services.py`
- `apps/imports/tasks.py`
- Test files

## Implementation Steps

1. Expand `ImportJob` model, generate migration
2. Write `parsers/csv_parser.py` → returns `list[dict]` + row errors
3. Write `parsers/json_parser.py` → same output contract
4. Write `validators.py` → validates each question dict (required fields, choice count, etc.)
5. Write `services.py`:
   - `process_import_job(job_id)` — parse → validate → bulk_create questions/choices/domains/tags
   - Update `ImportJob` status/progress throughout
6. Write `tasks.py` wrapping service
7. Write `views.py` — upload triggers task, list/retrieve for status polling
8. Write serializers
9. Wire `urls.py`
10. Write tests (parser unit + service integration + view)

## Success Criteria

- Upload CSV → job created → questions appear in `/api/questions/`
- Upload with invalid rows → job completes with per-row errors in `error_log`
- Job status polling shows progress
- Admin-only access enforced
- All tests pass

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|-----------|
| Large file upload memory | 🟡 Medium | Stream/chunk CSV reading with `csv.reader` |
| Domain/tag auto-creation race | 🟢 Low | Use `get_or_create` in service |
| Celery not available in test | 🟢 Low | Use `task.apply()` (sync) in tests |
