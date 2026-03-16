---
spec_id: phase-04-backend-analytics
version: "1.0"
status: pending
agents:
  - fullstack-developer
acceptance_criteria:
  - UserProgress aggregated correctly after each session
  - DomainScore tracked per domain per user
  - Analytics API endpoint returns structured data for dashboard
  - Async Celery task for heavy aggregation
  - Unit + integration tests pass
---

# Phase 04 — Backend: Analytics & Progress Tracking

**Priority:** Medium
**Depends on:** Phase 02 (Exam Engine), Phase 03 (Auth/Profile)
**Blocks:** Phase 07 (Frontend Dashboard/Analytics)

## Overview

Aggregate and expose user performance data. The analytics layer reads from `AttemptAnswer` / `ExamSession` records and materializes summaries for fast dashboard rendering.

## Key Insights

- Dashboard needs: total questions answered, overall accuracy %, recent sessions, domain breakdown
- Analytics page needs: per-domain scores, trend over time, weakest/strongest domains
- Materialized via `UserProgress` and `DomainScore` models (updated after each session)
- Heavy recalculation (e.g., rebuild all history) → Celery task
- Incremental update (after single session) → sync, triggered by signal from Phase 02

## Requirements

### Models (expand stubs)

**`UserProgress`** (expand stub)
```python
user                    # OneToOneField (already in stub)
total_questions_answered # PositiveIntegerField (already in stub)
total_correct           # PositiveIntegerField (already in stub)
total_sessions          # PositiveIntegerField(default=0)
total_exam_sessions     # PositiveIntegerField(default=0)
total_practice_sessions # PositiveIntegerField(default=0)
last_session_at         # DateTimeField(null=True)
current_streak_days     # PositiveSmallIntegerField(default=0)
```

**`DomainScore`**
```python
user            # ForeignKey → User
domain          # ForeignKey → Domain
questions_seen  # PositiveIntegerField(default=0)
correct_count   # PositiveIntegerField(default=0)
accuracy_pct    # DecimalField (computed property or stored)
last_updated    # DateTimeField(auto_now=True)

class Meta:
    unique_together = ('user', 'domain')
```

**`SessionHistory`** (denormalized view for History page)
```python
session         # OneToOneField → ExamSession
user            # ForeignKey → User (denormalized for fast query)
score_pct       # DecimalField
passed          # BooleanField
question_count  # PositiveSmallIntegerField
mode            # CharField
domain_name     # CharField (snapshot at time of session)
```

### API Endpoints

```
GET /api/analytics/summary/         Dashboard summary (UserProgress + top domains)
GET /api/analytics/domains/         Per-domain breakdown with accuracy
GET /api/analytics/history/         Paginated session history list
GET /api/analytics/trends/          Score trend over time (last 30 sessions)
```

### Celery Task

```python
# tasks.py
@shared_task
def rebuild_user_analytics(user_id: int):
    """Full recalculation from scratch — run on-demand or scheduled."""
```

## Architecture

```
apps/analytics/
├── models.py       # UserProgress (expand), DomainScore, SessionHistory
├── serializers.py  # SummarySerializer, DomainScoreSerializer, HistorySerializer
├── views.py        # SummaryView, DomainListView, HistoryListView, TrendView
├── services.py     # update_analytics_after_session(session), rebuild_user_analytics(user)
├── tasks.py        # rebuild_user_analytics Celery task
├── urls.py
└── tests/
    ├── test_services.py
    └── test_views.py
```

## Related Code Files

**Modify:**
- `apps/analytics/models.py` — expand stubs
- `apps/analytics/serializers.py` — expand
- `apps/analytics/views.py` — expand
- `apps/analytics/urls.py` — wire endpoints

**Create:**
- `apps/analytics/services.py`
- `apps/analytics/tasks.py`
- `apps/analytics/tests/test_services.py`
- `apps/analytics/tests/test_views.py`

**Integration point:**
- `apps/exams/signals.py` → calls `analytics.services.update_analytics_after_session`

## Implementation Steps

1. Expand `models.py` with `DomainScore`, `SessionHistory`, expand `UserProgress`
2. Generate migrations
3. Write `services.py`:
   - `update_analytics_after_session(session_id)` — incremental update
   - `rebuild_user_analytics(user_id)` — full recalculation
4. Write `tasks.py` wrapping rebuild service
5. Write `serializers.py` for all endpoints
6. Write `views.py`:
   - `SummaryView` — aggregate UserProgress + top 5 domains
   - `DomainListView` — all DomainScore for user, sorted by accuracy
   - `HistoryListView` — paginated SessionHistory
   - `TrendView` — last 30 sessions' score_pct for chart
7. Wire `urls.py`
8. Write tests

## Success Criteria

- After submitting exam session, analytics auto-update
- `GET /api/analytics/summary/` returns correct aggregates
- Domain scores reflect actual attempt history
- Celery task runs without errors
- All tests pass

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|-----------|
| Analytics stale after failed signal | 🟡 Medium | Idempotent update logic, retry on failure |
| Celery not running in dev | 🟢 Low | Fallback to sync in development settings |
| Large history queries slow | 🟡 Medium | Paginate, index `user` FK on all analytics models |
