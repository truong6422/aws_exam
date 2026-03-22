---
spec_id: full-project-implementation
version: "2.0"
status: pending
---

# AWS Exam App — Full Project Implementation Plan

**Plan ID:** 260315-0247-full-project-implementation
**Branch:** master
**Created:** 2026-03-15 | **Updated:** 2026-03-22 (brainstorm rewrite)

## Overview

Commercial AWS certification practice platform:
- **Exam Mode**: Timed (65Q/130min), scored, server-side timer, autosave every 30s
- **Practice Mode**: Instant feedback with explanation, no timer
- **Backend**: Django 5 + DRF + PostgreSQL + Redis (cache + JWT blacklist)
- **Frontend**: Vite + React SPA + React Router v6 + Zustand + TailwindCSS
- **Infra**: Docker Compose + Nginx + Sentry
- **Auth**: JWT access(15min) + refresh(7d) + Redis JTI blacklist

## Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend framework | **Vite + React SPA** (NOT Next.js) | YAGNI — exam pages are client-heavy, no SSR benefit |
| API style | REST `/api/v1/` only | DRF built-in, ship fastest |
| Database | Strict 3NF PostgreSQL | No JSONB snapshots, no difficulty field in MVP |
| Auth | JWT + Redis JTI blacklist | NOT simplejwt DB blacklist — auto-TTL, no table growth |
| Task queue | **None** (no Celery) | Redis for cache + blacklist only |
| Exam timer | Server-side `started_at + time_limit_minutes` | Validates on submit — prevents DevTools cheating |
| Serializer strategy | ExamSerializer / ReviewSerializer / AdminSerializer | `is_correct` never exposed during exam |
| Monitoring | Sentry (Django + React) from Phase 1 | Commercial product needs error tracking |

## Critical Security Risks (from brainstorm)

| Risk | Score | Mitigation |
|------|-------|------------|
| Exam state lost on refresh | 9/9 | Autosave PATCH every 30s + localStorage Zustand persist |
| `is_correct` exposed in exam API | 9/9 | Separate serializers — mandatory test coverage |
| JWT not revocable after logout | 6/9 | Redis JTI blacklist with TTL = token expiry |
| Single EC2 SPOF | 6/9 | Docker restart:always + RDS + Sentry + health endpoint |
| Client-only timer cheatable | 6/9 | Server validates `started_at + time_limit` on submit |

## Current Codebase State

| Component | Status | Notes |
|-----------|--------|-------|
| Project scaffold | ✅ Done | Django 5 + Vite + Docker Compose |
| Custom User model (email login) | ✅ Done | `apps/accounts/models.py` — AbstractUser |
| JWT auth (login/register/logout/me) | ✅ Done | `apps/accounts/` — uses simplejwt DB blacklist (needs Redis migration) |
| Login rate throttle | ✅ Done | `LoginRateThrottle` — 5/min per IP |
| React Router v6 + page stubs (16) | ✅ Done | All routes defined in `router/routes.tsx` |
| Zustand stores (auth, exam, ui) | ✅ Done | `auth-store.ts` has persist; `exam-store.ts` is basic stub |
| Docker Compose (dev + prod) | ✅ Done | Redis included |
| TimestampedModel base | ✅ Done | `apps/core/models.py` |
| Question model | 🔲 Stub | Single `title` field — needs full schema |
| Exam model | 🔲 Stub | Single `title` + `created_by` — needs full rewrite |
| Backend business logic | ❌ Not started | Serializers, views, endpoints all empty |
| Frontend wired to real APIs | ❌ Not started | Pages are UI stubs only |

## Phases

| # | Phase | Status | Depends On | File |
|---|-------|--------|------------|------|
| P1 | Backend: Question Bank | Pending | — | [phase-01](./phase-01-backend-question-bank.md) |
| P2 | Backend: Exam & Practice Engine | Pending | P1 | [phase-02](./phase-02-backend-exam-engine.md) |
| P3 | Backend: Auth Enhancement (Redis JTI) | Pending | — | [phase-03](./phase-03-backend-auth-profile.md) |
| P4 | Backend: Analytics & Progress | Pending | P2 | [phase-04](./phase-04-backend-analytics.md) |
| P5 | Backend: Admin Import Pipeline | Pending | P1 | [phase-05](./phase-05-backend-import.md) |
| P6 | Frontend: Exam & Practice Flows | Pending | P2 | [phase-06](./phase-06-frontend-exam-practice.md) |
| P7 | Frontend: Dashboard & Analytics | Pending | P4 | [phase-07](./phase-07-frontend-dashboard-analytics.md) |
| P8 | Frontend: Admin Panel | Pending | P5 | [phase-08](./phase-08-frontend-admin.md) |
| P9 | Integration & Security Tests | Pending | P6, P7, P8 | [phase-09](./phase-09-integration-tests.md) |
| P10 | Infra: Production Deploy | Pending | P9 | [phase-10](./phase-10-infra-deploy.md) |

## Dependency Graph

```
P1 (Question Bank) ──→ P2 (Exam Engine) ──→ P4 (Analytics)
                   └──→ P5 (Import)
P3 (Auth Redis) ───→ (parallel with P1/P2)
P2 ──→ P6 (Frontend Exam)
P4 ──→ P7 (Frontend Dashboard)
P5 ──→ P8 (Frontend Admin)
P6 + P7 + P8 ──→ P9 (Integration Tests)
P9 ──→ P10 (Deploy)
```

## Constraints

- All API endpoints under `/api/v1/` prefix
- Keep all code files under 200 lines (split into modules)
- YAGNI / KISS / DRY
- No Celery, no difficulty field, no JSONB snapshots
- JWT-only auth (no sessions)
- Vite + React SPA only (no Next.js)
- `Question.source` field added for future extensibility
