# Phase 01 — Backend: Question Bank — Completion Report

**Date:** 2026-03-22
**Status:** ✅ Complete

## Files Modified

| File | Action |
|------|--------|
| `apps/backend/apps/questions/models.py` | Replaced stub `Question(title)` with full 4-model schema |
| `apps/backend/apps/questions/serializers.py` | Rewritten — 6 serializers with exam/review security split |
| `apps/backend/apps/questions/views.py` | Rewritten — `CertificationListView` + `DomainListView` |
| `apps/backend/apps/questions/urls.py` | Rewritten — 2 versioned endpoints |
| `apps/backend/apps/questions/admin.py` | Rewritten — all 4 models registered with `AnswerInline` |
| `apps/backend/config/urls.py` | Added `api/v1/questions/` prefix (kept `api/questions/` for compat) |
| `apps/backend/apps/questions/migrations/0001_initial.py` | Deleted old stub migration, generated fresh |

## Files Created

| File | Action |
|------|--------|
| `apps/backend/apps/questions/management/__init__.py` | Created (empty) |
| `apps/backend/apps/questions/management/commands/__init__.py` | Created (empty) |
| `apps/backend/apps/questions/management/commands/seed_certifications.py` | Created — idempotent seed command |

## Migration Output

```
Migrations for 'questions':
  apps/questions/migrations/0001_initial.py
    - Create model Certification
    - Create model Domain
    - Create model Question
    - Create model Answer

Applying questions.0001_initial... OK
All other app migrations applied OK.
```

## Seed Output

```
Created certification: SAA-C03 — Solutions Architect Associate
Created certification: CLF-C02 — Cloud Practitioner
Created certification: DVA-C02 — Developer Associate

Done — created 3 certifications, 12 domains, 24 questions, 96 answers.
```

## Verification

```
Certifications: 3
Domains: 12  (4 per cert)
Questions: 24 (2 per domain)
Answers: 96  (4 per question)

  CLF-C02: 4 domains
  DVA-C02: 4 domains
  SAA-C03: 4 domains
```

## Serializer Security Check

```
AnswerExamSerializer fields:     {'text', 'id'}           ✅ NO is_correct
AnswerReviewSerializer fields:   {'is_correct', 'text', 'id'}
QuestionExamSerializer fields:   {'answers', 'text', 'id', 'question_type'}   ✅ NO explanation
QuestionReviewSerializer fields: {'explanation', 'text', 'answers', 'id', 'question_type'}
All serializer security checks PASSED
```

## Issues Found / Notes

1. **Docker port conflict** — host port 5432 was already bound by a local PostgreSQL instance. Resolved by creating a temporary `docker-compose.portfix.yml` override with `ports: !reset []` to remove the host-port binding for the `db` container (inter-container communication still works via the `dev_net` internal network). File deleted after use.

2. **API container restart loop** — The `.env` file (loaded via `env_file:`) was overriding `DB_HOST` with `localhost` instead of `db`. All Docker commands were run with explicit `-e DB_HOST=db` overrides. The `.env` file in the repo should set `DB_HOST=db` for Docker dev usage — this is a pre-existing config gap, not introduced by this phase.

3. **URL namespace warning** — `urls.W005: URL namespace 'questions' isn't unique` is expected since both `api/questions/` (legacy) and `api/v1/questions/` include the same urls module. This is a warning only, not an error, and backward compatibility is preserved.

## Acceptance Criteria

- ✅ Certification, Domain, Question, Answer models pass makemigrations + migrate
- ✅ GET /api/v1/questions/certifications/ returns list of certs (public, no auth)
- ✅ GET /api/v1/questions/certifications/{id}/domains/ returns domains (auth required)
- ✅ AnswerExamSerializer excludes is_correct field
- ✅ QuestionExamSerializer excludes explanation field
- ✅ QuestionReviewSerializer includes is_correct + explanation
- ✅ seed_certifications creates SAA-C03, CLF-C02, DVA-C02 with domains + sample questions
- ✅ Django admin registers all 4 models with inline Answer editing
