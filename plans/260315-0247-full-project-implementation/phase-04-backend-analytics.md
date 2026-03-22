---
spec_id: phase-04-backend-analytics
version: "1.0"
status: completed
blockedBy:
  - phase-02-backend-exam-engine
agents:
  - fullstack-developer
acceptance_criteria:
  - "GET /api/v1/analytics/overview/ returns total_attempts, avg_score, best_score, recent_trend"
  - "GET /api/v1/analytics/weak-domains/?certification_id=X returns domains ranked by avg score (lowest first)"
  - "GET /api/v1/analytics/history/ returns paginated exam attempt list with scores"
  - "All analytics endpoints return only the authenticated user's data"
  - "Empty state (no attempts) returns sensible defaults (zeros, empty arrays)"
  - "recent_trend contains last 7 submitted attempts ordered by date"
---

# Phase 04 — Backend: Analytics & Progress

## Overview

- **Priority**: P2 (Dashboard data — needed for P7 frontend)
- **Depends on**: P2 (ExamAttempt + AttemptAnswer models must exist)
- **Blocks**: P7 (Frontend Dashboard & Analytics)
- **Description**: Aggregate exam history into analytics. No new models — purely computed from ExamAttempt + AttemptAnswer using Django ORM aggregations.

## Related Code Files

### Modify
- `apps/backend/apps/analytics/views.py` — create 3 analytics views
- `apps/backend/apps/analytics/serializers.py` — create response serializers
- `apps/backend/apps/analytics/urls.py` — wire 3 endpoints
- `apps/backend/config/urls.py` — add `/api/v1/analytics/` prefix

### Create
- None (all files exist as stubs)

### Delete
- None

## Implementation Steps

### Step 1: Create Serializers

In `apps/analytics/serializers.py`:

1. **OverviewSerializer** (Serializer, not ModelSerializer):
   - `total_attempts`: IntegerField()
   - `avg_score`: DecimalField(max_digits=5, decimal_places=2)
   - `best_score`: DecimalField(max_digits=5, decimal_places=2)
   - `total_submitted`: IntegerField()
   - `recent_trend`: ListField(child=DictField()) — last 7 attempts: [{date, score, certification_code}]

2. **WeakDomainSerializer** (Serializer):
   - `domain_id`: IntegerField()
   - `domain_name`: CharField()
   - `certification_code`: CharField()
   - `total_questions`: IntegerField()
   - `correct_count`: IntegerField()
   - `accuracy_percentage`: DecimalField(max_digits=5, decimal_places=2)

3. **HistoryItemSerializer** (ModelSerializer on ExamAttempt):
   - Fields: `[id, certification_code, certification_name, started_at, submitted_at, status, score_percentage, total_questions, correct_count]`
   - `certification_code` and `certification_name` via SerializerMethodField

### Step 2: Create Overview View

**OverviewView** (GET `/analytics/overview/`):

Query logic:
```python
attempts = ExamAttempt.objects.filter(
    user=request.user,
    status__in=['submitted', 'expired']
)
total_attempts = attempts.count()
aggregates = attempts.aggregate(
    avg_score=Avg('score_percentage'),
    best_score=Max('score_percentage')
)
recent_trend = attempts.order_by('-submitted_at')[:7].values(
    'submitted_at', 'score_percentage', 'certification__code'
)
```

Return sensible defaults when no attempts:
```python
{
    'total_attempts': 0,
    'avg_score': 0,
    'best_score': 0,
    'total_submitted': 0,
    'recent_trend': []
}
```

### Step 3: Create Weak Domains View

**WeakDomainsView** (GET `/analytics/weak-domains/?certification_id=X`):

Query logic:
- Get all AttemptAnswers for user's submitted attempts, filtered by certification_id
- Group by `question__domain`, calculate accuracy per domain
- Use annotate + aggregate:

```python
domain_stats = AttemptAnswer.objects.filter(
    attempt__user=request.user,
    attempt__status__in=['submitted', 'expired'],
    attempt__certification_id=certification_id
).values(
    'question__domain__id',
    'question__domain__name',
    'question__domain__certification__code'
).annotate(
    total_questions=Count('id'),
).order_by('question__domain__name')
```

For correctness calculation: iterate domain_stats and check each AttemptAnswer's selected_answers vs correct answers. (Alternative: pre-compute `is_correct` boolean field on AttemptAnswer during submit — simpler query later.)

**Optimization**: During exam submit (Phase 2), add `is_correct` BooleanField to AttemptAnswer. Then weak domains query becomes a simple `Avg('is_correct')` group-by.

If `is_correct` field not available, compute in Python:
```python
for stat in domain_stats:
    # Count correct answers per domain
    correct = AttemptAnswer.objects.filter(
        attempt__user=request.user,
        question__domain_id=stat['question__domain__id'],
        ...
    )  # check in Python loop
```

Order results by accuracy ascending (weakest first).

### Step 4: Create History View

**HistoryView** (GET `/analytics/history/`):

Simple paginated list:
```python
queryset = ExamAttempt.objects.filter(
    user=request.user
).select_related('certification').order_by('-started_at')
```

Uses `HistoryItemSerializer` and DRF's built-in pagination.

### Step 5: Wire URLs

In `apps/analytics/urls.py`:
```
overview/ → OverviewView (GET)
weak-domains/ → WeakDomainsView (GET)
history/ → HistoryView (GET)
```

In `config/urls.py`, add:
```python
path("api/v1/analytics/", include(("apps.analytics.urls", "analytics_v1"))),
```

### Step 6: Optimization — Add is_correct to AttemptAnswer

Consider adding `is_correct = BooleanField(null=True)` to `AttemptAnswer` model (in Phase 2). Set during exam submit. This makes analytics queries O(1) instead of O(n) per answer.

If this optimization is added to Phase 2, update weak-domains query to:
```python
.annotate(accuracy=Avg(Cast('is_correct', FloatField())))
.order_by('accuracy')
```

## API Endpoints

| Method | Path | Auth | Request Body | Response |
|--------|------|------|-------------|----------|
| GET | `/api/v1/analytics/overview/` | Bearer JWT | — | `{total_attempts, avg_score, best_score, total_submitted, recent_trend: [{date, score, certification_code}]}` |
| GET | `/api/v1/analytics/weak-domains/?certification_id=X` | Bearer JWT | — | `[{domain_id, domain_name, certification_code, total_questions, correct_count, accuracy_percentage}]` |
| GET | `/api/v1/analytics/history/` | Bearer JWT | — | Paginated `[{id, certification_code, certification_name, started_at, submitted_at, status, score_percentage, total_questions, correct_count}]` |

## Security Considerations

- **User isolation**: All queries MUST filter by `request.user`. Never expose another user's analytics.
- **No write endpoints**: Analytics are read-only computed views — no data mutation.
- **Query performance**: Use `select_related('certification')` to avoid N+1. For weak-domains, prefetch answers.
- **Pagination**: History endpoint must be paginated (DRF default PAGE_SIZE=20).

## Acceptance Criteria

- GET /api/v1/analytics/overview/ returns total_attempts, avg_score, best_score, recent_trend
- GET /api/v1/analytics/weak-domains/?certification_id=X returns domains ranked by avg score (lowest first)
- GET /api/v1/analytics/history/ returns paginated exam attempt list with scores
- All analytics endpoints return only the authenticated user's data
- Empty state (no attempts) returns sensible defaults (zeros, empty arrays)
- recent_trend contains last 7 submitted attempts ordered by date
