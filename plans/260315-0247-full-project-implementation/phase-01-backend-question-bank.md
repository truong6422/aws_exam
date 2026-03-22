---
spec_id: phase-01-backend-question-bank
version: "1.0"
status: completed
agents:
  - fullstack-developer
acceptance_criteria:
  - "✅ Certification, Domain, Question, Answer models pass makemigrations + migrate"
  - "✅ GET /api/v1/questions/certifications/ returns list of certs (public, no auth)"
  - "✅ GET /api/v1/questions/certifications/{id}/domains/ returns domains (auth required)"
  - "✅ AnswerExamSerializer excludes is_correct field"
  - "✅ QuestionExamSerializer excludes explanation field"
  - "✅ QuestionReviewSerializer includes is_correct + explanation"
  - "✅ seed_certifications command creates SAA-C03, CLF-C02, DVA-C02 with domains + sample questions"
  - "✅ Django admin registers all 4 models with inline Answer editing"
---

# Phase 01 — Backend: Question Bank

## Overview

- **Priority**: P0 (Critical — all other phases depend on this)
- **Depends on**: Nothing (foundational)
- **Blocks**: P2 (Exam Engine), P5 (Import)
- **Description**: Replace stub Question model with full 3NF schema: Certification → Domain → Question → Answer. Create serializers with security split (Exam vs Review vs Admin). Add seed data command.

## Related Code Files

### Modify
- `apps/backend/apps/questions/models.py` — replace stub with full schema
- `apps/backend/apps/questions/serializers.py` — create serializer hierarchy
- `apps/backend/apps/questions/views.py` — certification + domain list views
- `apps/backend/apps/questions/urls.py` — wire endpoints
- `apps/backend/apps/questions/admin.py` — register models with inlines
- `apps/backend/config/urls.py` — add `/api/v1/questions/` prefix

### Create
- `apps/backend/apps/questions/management/__init__.py`
- `apps/backend/apps/questions/management/commands/__init__.py`
- `apps/backend/apps/questions/management/commands/seed_certifications.py`

### Delete
- None

## Implementation Steps

### Step 1: Replace Question Models

Replace the entire `apps/questions/models.py` with 4 models:

1. **Certification** — extends `TimestampedModel`:
   - `code`: CharField(max_length=20, unique=True) — e.g. "SAA-C03"
   - `name`: CharField(max_length=255)
   - `description`: TextField()
   - `time_limit_minutes`: PositiveIntegerField(default=130)
   - `total_questions`: PositiveIntegerField(default=65)
   - `passing_score`: PositiveIntegerField(default=72) — percentage
   - `__str__` returns `f"{self.code} — {self.name}"`

2. **Domain** — extends `TimestampedModel`:
   - `certification`: ForeignKey(Certification, CASCADE, related_name='domains')
   - `name`: CharField(max_length=255)
   - `weight_percentage`: PositiveIntegerField(default=0)
   - Meta: `unique_together = ('certification', 'name')`
   - `__str__` returns `f"{self.certification.code} / {self.name}"`

3. **Question** — extends `TimestampedModel`:
   - `domain`: ForeignKey(Domain, CASCADE, related_name='questions')
   - `text`: TextField()
   - `explanation`: TextField(blank=True)
   - `source`: CharField(max_length=255, blank=True)
   - `question_type`: CharField(choices=[('single','Single'),('multiple','Multiple')], default='single', max_length=10)
   - `__str__` returns `self.text[:80]`

4. **Answer** — plain `models.Model` (no timestamps needed):
   - `question`: ForeignKey(Question, CASCADE, related_name='answers')
   - `text`: TextField()
   - `is_correct`: BooleanField()
   - Meta: `unique_together = ('question', 'text')`
   - `__str__` returns `f"{'✓' if self.is_correct else '✗'} {self.text[:50]}"`

### Step 2: Create Serializers

In `apps/questions/serializers.py`, create layered serializers:

1. **AnswerExamSerializer** — `fields = ['id', 'text']` (NO is_correct)
2. **AnswerReviewSerializer** — `fields = ['id', 'text', 'is_correct']`
3. **QuestionExamSerializer** — `fields = ['id', 'text', 'question_type', 'answers']`, uses `AnswerExamSerializer(many=True)`
4. **QuestionReviewSerializer** — `fields = ['id', 'text', 'explanation', 'question_type', 'answers']`, uses `AnswerReviewSerializer(many=True)`
5. **CertificationSerializer** — `fields = ['id', 'code', 'name', 'description', 'time_limit_minutes', 'total_questions', 'passing_score']`
6. **DomainSerializer** — `fields = ['id', 'name', 'weight_percentage', 'certification']`

### Step 3: Create Views

In `apps/questions/views.py`:

1. **CertificationListView** — `generics.ListAPIView`, queryset `Certification.objects.all()`, `permission_classes = [AllowAny]`, uses `CertificationSerializer`
2. **DomainListView** — `generics.ListAPIView`, queryset filtered by `certification_id` from URL kwargs, `permission_classes = [IsAuthenticated]`, uses `DomainSerializer`
   - Override `get_queryset` to filter: `Domain.objects.filter(certification_id=self.kwargs['certification_id'])`

### Step 4: Wire URLs

In `apps/questions/urls.py`:
```
certifications/ → CertificationListView
certifications/<int:certification_id>/domains/ → DomainListView
```

In `config/urls.py`, add:
```python
path("api/v1/questions/", include(("apps.questions.urls", "questions_v1"))),
```

### Step 5: Register Admin

In `apps/questions/admin.py`:
- `AnswerInline` — TabularInline for Answer, extra=4
- `QuestionAdmin` — list_display: text[:80], domain, question_type. Inlines: [AnswerInline]. list_filter: domain__certification, question_type. search_fields: text.
- `DomainAdmin` — list_display: name, certification, weight_percentage
- `CertificationAdmin` — list_display: code, name, total_questions, passing_score

### Step 6: Create Seed Command

In `seed_certifications.py` management command:
- Create 3 certifications with real AWS data:
  - **SAA-C03**: Solutions Architect Associate, 130min, 65Q, 72% pass
    - Domains: Design Secure Architectures (30%), Design Resilient Architectures (26%), Design High-Performing Architectures (24%), Design Cost-Optimized Architectures (20%)
  - **CLF-C02**: Cloud Practitioner, 90min, 65Q, 70% pass
    - Domains: Cloud Concepts (24%), Security and Compliance (30%), Cloud Technology and Services (34%), Billing, Pricing and Support (12%)
  - **DVA-C02**: Developer Associate, 130min, 65Q, 72% pass
    - Domains: Development with AWS Services (32%), Security (26%), Deployment (24%), Troubleshooting and Optimization (18%)
- Create 2-3 sample questions per domain with 4 answers each
- Use `get_or_create` to be idempotent

### Step 7: Run Migrations

```bash
python manage.py makemigrations questions
python manage.py migrate
python manage.py seed_certifications
```

## API Endpoints

| Method | Path | Auth | Request Body | Response |
|--------|------|------|-------------|----------|
| GET | `/api/v1/questions/certifications/` | Public | — | `[{id, code, name, description, time_limit_minutes, total_questions, passing_score}]` |
| GET | `/api/v1/questions/certifications/{id}/domains/` | Bearer JWT | — | `[{id, name, weight_percentage, certification}]` |

## Security Considerations

- **Serializer split is CRITICAL**: `AnswerExamSerializer` must NEVER include `is_correct`. This prevents cheating during exam mode.
- Certifications list is public (needed on exam setup page before login not required, but accessible to all).
- Domain list requires auth — prevents unauthorized scraping of question structure.
- Admin inline editing requires `is_staff` via Django admin auth.

## Acceptance Criteria

- Certification, Domain, Question, Answer models pass makemigrations + migrate
- GET /api/v1/questions/certifications/ returns list of certs (public, no auth)
- GET /api/v1/questions/certifications/{id}/domains/ returns domains (auth required)
- AnswerExamSerializer excludes is_correct field
- QuestionExamSerializer excludes explanation field
- QuestionReviewSerializer includes is_correct + explanation
- seed_certifications command creates SAA-C03, CLF-C02, DVA-C02 with domains + sample questions
- Django admin registers all 4 models with inline Answer editing
