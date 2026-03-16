---
spec_id: phase-01-backend-question-bank
version: "1.0"
status: pending
agents:
  - fullstack-developer
acceptance_criteria:
  - Question, Choice, Domain, Tag models defined with full schema
  - Migrations created and applied cleanly
  - DRF serializers for all models
  - CRUD API endpoints with proper permissions
  - Admin registered for all models
  - Unit tests coverage ≥ 80%
---

# Phase 01 — Backend: Question Bank

**Priority:** High
**Depends on:** None (can start immediately)
**Blocks:** Phase 02 (Exam Engine), Phase 05 (Import)

## Overview

Expand the stub `Question` model into a full question bank schema. This is the foundational data layer — every other backend feature depends on having real question data.

## Key Insights

- Current stub: `Question(title)` only — not usable
- AWS exams use single/multiple-choice questions with 4–6 answer choices
- Questions belong to AWS service domains (e.g., S3, EC2, IAM, Lambda)
- Questions can have tags (difficulty level, certification type: SAA-C03, SAP-C02, etc.)
- Each choice has: text + `is_correct` flag
- Explanations explain the correct answer (shown after submission in Practice mode)
- Filtering by domain/tag is critical for Practice mode setup

## Requirements

### Models

**`Question`**
```python
stem           # CharField(max_length=2000) — question text
question_type  # CharField: 'single' | 'multiple' (multiple correct answers)
domain         # ForeignKey → Domain
tags           # ManyToMany → Tag
difficulty     # CharField: 'easy' | 'medium' | 'hard'
explanation    # TextField — shown after answer in practice mode
is_active      # BooleanField(default=True) — soft-delete/hide
created_by     # ForeignKey → User (null=True)
```

**`Choice`**
```python
question       # ForeignKey → Question (related_name='choices')
text           # CharField(max_length=1000)
is_correct     # BooleanField
order          # PositiveSmallIntegerField — display order
```

**`Domain`**
```python
name           # CharField(max_length=100, unique=True)  e.g. "S3", "IAM", "Lambda"
slug           # SlugField(unique=True)
description    # TextField(blank=True)
```

**`Tag`**
```python
name           # CharField(max_length=50, unique=True)  e.g. "SAA-C03", "hard", "networking"
slug           # SlugField(unique=True)
```

### API Endpoints

```
GET  /api/questions/                  List questions (paginated, filterable)
POST /api/questions/                  Create question (admin only)
GET  /api/questions/{id}/             Retrieve question
PUT  /api/questions/{id}/             Update question (admin only)
DEL  /api/questions/{id}/             Soft-delete (admin only)
GET  /api/questions/domains/          List all domains
GET  /api/questions/tags/             List all tags
```

**Filtering params for list endpoint:**
- `?domain=<slug>` — filter by domain
- `?tag=<slug>` — filter by tag
- `?difficulty=easy|medium|hard`
- `?question_type=single|multiple`
- `?search=<text>` — full-text search on stem

### Permissions
- `GET` endpoints: `IsAuthenticated`
- `POST/PUT/DELETE`: `IsAdminUser`
- Choices are nested inside question (not separate endpoints)

## Architecture

```
apps/questions/
├── models.py          # Question, Choice, Domain, Tag (split if >200 lines)
├── serializers.py     # QuestionSerializer, DomainSerializer, TagSerializer
├── views.py           # QuestionViewSet, DomainListView, TagListView
├── filters.py         # DjangoFilterBackend config
├── permissions.py     # (reuse DRF's IsAdminUser)
├── admin.py           # Register all models with inline Choice
├── urls.py            # Router + extra routes
└── tests/
    ├── test_models.py
    ├── test_serializers.py
    └── test_views.py
```

## Related Code Files

**Modify:**
- `apps/questions/models.py` — replace stub with full schema
- `apps/questions/serializers.py` — expand
- `apps/questions/views.py` — expand
- `apps/questions/admin.py` — register with StackedInline for choices
- `apps/questions/urls.py` — wire DRF router

**Create:**
- `apps/questions/filters.py`
- `apps/questions/tests/test_models.py`
- `apps/questions/tests/test_views.py`

## Implementation Steps

1. Update `models.py`: define `Domain`, `Tag`, full `Question`, `Choice`
2. Generate and run migrations
3. Update `admin.py` with `ChoiceInline` and register all models
4. Write `serializers.py`:
   - `DomainSerializer`, `TagSerializer`
   - `ChoiceSerializer` (nested)
   - `QuestionListSerializer` (no choices — for list performance)
   - `QuestionDetailSerializer` (with choices nested)
   - `QuestionWriteSerializer` (for admin create/update with writable choices)
5. Write `filters.py` using `django-filter`
6. Write `views.py`:
   - `QuestionViewSet` (ModelViewSet, filterable, searchable)
   - `DomainListView` (ListAPIView)
   - `TagListView` (ListAPIView)
7. Update `urls.py` with DRF router
8. Write tests

## Success Criteria

- `GET /api/questions/` returns paginated question list with domain/tag filters
- `GET /api/questions/{id}/` returns question with all choices
- Admin can CRUD questions via API
- All migrations clean, no conflicts
- Tests pass, coverage ≥ 80%

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|-----------|
| models.py exceeds 200 lines | 🟡 Medium | Split Domain/Tag into separate file if needed |
| N+1 query on choices | 🟡 Medium | Use `prefetch_related('choices')` in viewset |
| Migration conflicts with stub | 🟢 Low | Use `--merge` or squash if needed |
