---
id: 260422-1204-practice-questions-tracking
title: Practice Questions Tracking
status: ready-to-cook
created_at: 2026-04-22T12:04:00+07:00
branch: master
---

# Practice Questions Tracking

## Objective

Track how many unique practice questions each user has studied (clicked "View Answer"). Surface the aggregate total on the admin dashboard: **Total Questions Done = Exam Answers + Practice Views**.

## Design Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Counting method | Unique per (user, question) | User asked for "số câu đã học" — not repeated views |
| Storage | New `PracticeQuestionView` model | Must store (user, question) pairs to enforce uniqueness |
| API idempotency | `get_or_create` | Re-clicking View Answer is safe, no double counts |
| Auth requirement | `IsAuthenticated` | Only track logged-in users; guests ignored |
| Admin granularity | Dashboard aggregate only | User confirmed: no need for per-user detail view |

## Architecture

```
PracticeQuestionView
├── user      FK → User (CASCADE)
├── question  FK → Question (CASCADE)
└── viewed_at DateTimeField (auto_now_add=True)
UNIQUE_TOGETHER (user, question)

POST /api/v1/questions/practice/viewed/
Body: { question_id: int }
Response: { created: bool, total_practice_views: int }
Auth: IsAuthenticated
```

## Files Changed

### Backend
| File | Change |
|------|--------|
| `apps/backend/apps/questions/models.py` | Add `PracticeQuestionView` model |
| `apps/backend/apps/questions/views.py` | Add `PracticeViewedView` endpoint |
| `apps/backend/apps/questions/urls.py` | Add route `practice/viewed/` |
| `apps/backend/apps/questions/migrations/0008_practicequestionview.py` | New migration |
| `apps/backend/apps/accounts/admin_views.py` | Add `total_questions_done` to `dashboard_stats` |

### Frontend
| File | Change |
|------|--------|
| `apps/frontend/src/services/exam-api.ts` | Add `markQuestionViewed(questionId)` |
| `apps/frontend/src/pages/practice/practice-session-page.tsx` | Call API on View Answer (auth users only) |
| `apps/frontend/src/services/admin-api.ts` | Add `total_questions_done` to `DashboardStats` type |
| `apps/frontend/src/pages/admin/admin-dashboard-page.tsx` | Add stat card for total questions done |
| `apps/frontend/src/i18n/locales/en.json` | Add `admin.total_questions_done` key |
| `apps/frontend/src/i18n/locales/vi.json` | Add `admin.total_questions_done` key |

## Phases

- [Phase 01 — Backend](phase-01-backend.md)
- [Phase 02 — Frontend](phase-02-frontend.md)

## Test Strategy

- Manual: Log in → practice → click View Answer → check API returns `created: true`
- Manual: Click View Answer on same question again → API returns `created: false`
- Manual: Admin dashboard shows incremented count
- Manual: Guest users click View Answer → no API call, no error
