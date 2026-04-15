# Brainstorm Report — AWS Exam App Development Strategy
**Date:** 2026-03-22 | **Plan:** 260315-0247-full-project-implementation

---

## Problem Statement

Xây dựng sản phẩm thương mại thi thử AWS certification (SAA-C03, CLF-C02, DVA-C02) với 2 chế độ: Exam Mode (timed, scored) và Practice Mode (instant feedback). Stack: Django + Next.js + PostgreSQL + Redis.

---

## Requirements Summary

| Category | Finding |
|----------|---------|
| WHO | Commercial product — end users ôn thi AWS certs. Single dev. |
| WHAT | Exam Mode + Practice Mode + Admin import + Dashboard analytics |
| WHEN | No hard deadline. MVP first, deploy sau. |
| WHERE | AWS EC2 + Docker. Public internet. |
| WHY | Commercial product — security + reliability tiêu chuẩn cao hơn portfolio |
| HOW | Full-stack parallel. Django 5 DRF + Next.js 14 App Router |

---

## Evaluated Approaches

### API Style
| Option | Verdict |
|--------|---------|
| REST /api/v1/ | ✅ **Chosen** — simple, DRF native, ship fastest |
| REST + GraphQL | ❌ Over-engineering cho scale hiện tại |

### DB Schema
| Option | Verdict |
|--------|---------|
| Strict 3NF (per spec) | ✅ **Chosen** — simple, đủ dùng MVP |
| Hybrid + JSONB snapshot | ❌ Rejected — complexity không cần thiết v1 |

### Frontend
| Option | Verdict |
|--------|---------|
| Next.js App Router | ✅ **Chosen** — SSR, SEO, commercial product |
| React SPA | ❌ No SSR, SEO kém cho commercial |

---

## Final Architecture

```
Backend:   Django 5 + DRF + PostgreSQL + Redis
Frontend:  Next.js 14 App Router + TailwindCSS + Zustand
Auth:      JWT access(15m) + refresh(7d) + Redis JTI blacklist
Infra:     Docker Compose + Nginx + EC2
Removed:   Celery (YAGNI), difficulty field (YAGNI MVP v1)
Added:     Autosave endpoint, server-side timer, source field on Question
```

---

## Risk Matrix

| # | Risk | Score | Category | Mitigation |
|---|------|-------|----------|------------|
| 1 | Exam state mất khi refresh | 9 | 🔴 Critical | PATCH autosave + localStorage sync 30s |
| 2 | `is_correct` exposed trong API | 9 | 🔴 Critical | Separate ExamSerializer (no is_correct) |
| 3 | JWT không revocable | 6 | 🔴 Critical | Redis JTI blacklist on logout |
| 4 | Single EC2 SPOF | 6 | 🔴 Critical | restart:always + RDS + Sentry |
| 5 | Exam timer client-only = cheatable | 6 | 🔴 Critical | Server-side validate on submit |

---

## Key Persona Insights

**Security 🔒**
- Separate serializers mandatory (exam vs admin)
- JSON import cần schema validation + HTML sanitize
- JWT blacklist implemented từ Phase 1

**DevOps 🔧**
- structlog JSON logging + Sentry từ đầu
- RDS managed Postgres thay container trong prod
- `/api/v1/health/` endpoint bắt buộc

**End User 👤**
- Autosave là must-have, không optional
- Question grid với trạng thái màu (answered/unanswered/flagged) — giống AWS real exam
- Onboarding flow cho user mới (chọn cert muốn ôn)

**YAGNI ✂️**
- AI Explanation → skip hoàn toàn MVP v1
- Celery → removed
- difficulty → removed MVP v1

**Competitor 🔍**
- "Add to Practice List" button trong review screen → high value, low effort
- `Question.source` field → thêm ngay (cheap, cho extensibility)

---

## Acceptance Criteria

- [ ] Exam: 65 câu, timer 130min server-validated
- [ ] Exam: autosave mỗi 30s, state survive refresh
- [ ] Practice: instant feedback + explanation sau mỗi câu
- [ ] API: `is_correct` never in exam response
- [ ] Auth: logout thật sự invalidate token (Redis blacklist)
- [ ] Admin: JSON import với schema validation
- [ ] Dashboard: recent exams + weak domains
- [ ] Docker: `docker-compose up` start tất cả services

---

## Architecture Decisions

1. JWT: access 15m + refresh 7d + Redis JTI blacklist
2. Exam timer: `started_at` + `time_limit_minutes` trong DB, validate on submit
3. Serializer tách: ExamSerializer (safe) vs AdminSerializer (full)
4. Redis dùng cho: caching + JWT blacklist (không cần Celery)
5. `Question.source` field thêm ngay cho future extensibility
6. Next.js App Router (SSR) thay React SPA

---

## Implementation Phases (Revised)

```
Phase 1: Infra + Auth Foundation
  - Docker Compose, JWT+Redis blacklist, health endpoint

Phase 2: Data Models + Admin Import
  - Cert/Domain/Question/Answer models (no difficulty), JSON import validated

Phase 3: Exam Mode (Backend + Frontend)
  - ExamAttempt, autosave, server-side timer, Next.js exam page

Phase 4: Practice Mode (Backend + Frontend)
  - Question filter, explanation display, Next.js practice page

Phase 5: Dashboard + Analytics
  - Recent exams, weak domains, result page

Phase 6: Security + Infra Polish
  - Rate limiting, Redis caching, Sentry, production Docker
```

---

## Next Steps

→ Run `/plan` để tạo/update implementation plan chi tiết theo brainstorm này.
→ Existing plan `260315-0247-full-project-implementation` cần update để incorporate security decisions (autosave, serializer split, Redis blacklist).

**Unresolved questions:**
- RDS vs Postgres container trong production — cost consideration cần quyết định khi đến Phase 6
- Pricing model cho commercial product chưa xác định (subscription? one-time?)
