---
spec_id: 260418-1923-credit-wallet-exam-purchase-phase-03
status: pending
phase: 03
title: Access Logic Updates
depends_on: phase-01
acceptance_criteria:
  - ExamSetListView returns is_locked=False sets with price_credits and is_unlocked fields
  - ExamSetListView returns all sets to staff (including locked)
  - ExamStartView blocks if is_locked=True (403)
  - ExamStartView blocks if price_credits>0 and no UserExamUnlock (403)
  - ExamStartView allows if price_credits=0 and is_locked=False
  - ExamStartView allows if price_credits>0, is_locked=False, and UserExamUnlock exists
  - PracticeQuestionListView includes questions from sets the user has purchased
  - ExamSetSerializer updated with price_credits and is_unlocked fields
---

# Phase 03 — Access Logic Updates

## Requirements

Update the existing view/serializer logic to enforce the new two-dimensional access control:
1. `is_locked` — hard admin control (blocks everyone including paid users)
2. `price_credits` — soft paywall (unlocked by purchasing)

This phase touches:
- `apps/backend/apps/questions/serializers.py` — `ExamSetSerializer`
- `apps/backend/apps/questions/views.py` — `ExamSetListView`, `PracticeQuestionListView`
- `apps/backend/apps/exams/exam_views.py` — `ExamStartView`

## Access Rules (Canonical)

```
can_access(user, exam_set) = (
    NOT exam_set.is_locked                     # hard-lock gate
    AND (
        exam_set.price_credits == 0            # free
        OR UserExamUnlock.exists(user, exam_set)  # purchased
    )
)
```

For list display (ExamSetListView), we return ALL `is_locked=False` sets (including paid ones), annotated with `is_unlocked` and `price_credits`. This allows the UI to show "buy" buttons.

For staff users, return ALL sets (locked + unlocked) for management purposes.

## Implementation Steps

### Step 1 — Update `ExamSetSerializer`

In `apps/backend/apps/questions/serializers.py`:

```python
class ExamSetSerializer(serializers.ModelSerializer):
    question_count = serializers.IntegerField(source='questions.count', read_only=True)
    is_unlocked = serializers.SerializerMethodField()

    class Meta:
        model = ExamSet
        fields = ['id', 'name', 'description', 'is_locked', 'price_credits',
                  'question_count', 'is_unlocked']
        # price_credits writable only by admin (ExamSetUpdateView uses this serializer)
        # For user-facing, price_credits is read-only effectively (update requires IsAdminUser)

    def get_is_unlocked(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        if request.user.is_staff:
            return True  # staff always has access
        if obj.price_credits == 0:
            return True  # free
        from apps.questions.models import UserExamUnlock
        return UserExamUnlock.objects.filter(
            user=request.user, exam_set=obj
        ).exists()
```

Note: `is_unlocked` is `True` for free sets (price_credits=0), staff, and purchased sets. It is `False` for paid+not-purchased sets. This is the client's single source of truth for "can start" (combined with `is_locked`).

### Step 2 — Update `ExamSetListView`

Current behavior: non-staff users only see `is_locked=False` sets.

New behavior:
- Non-staff: return all `is_locked=False` sets (regardless of price). Annotate `is_unlocked` via serializer.
- Staff: return ALL sets (current behavior preserved).
- Natural sort preserved.

```python
class ExamSetListView(generics.ListAPIView):
    serializer_class = ExamSetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = ExamSet.objects.filter(
            certification_id=self.kwargs['certification_id']
        )
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_locked=False)
        # Natural sort (existing logic, unchanged)
        import re
        def natural_sort_key(s):
            return [int(text) if text.isdigit() else text.lower()
                    for text in re.split('([0-9]+)', s.name)]
        return sorted(queryset, key=natural_sort_key)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        return context  # request already in context via default implementation
```

The `get_serializer_context()` call is not strictly necessary (DRF's `GenericAPIView` already passes request in context), but including it explicitly is safe.

**IMPORTANT**: The `sorted()` call returns a Python list, not a QuerySet. Calling `serializer_class(queryset, many=True, context=self.get_serializer_context())` works fine with a list. The `ListAPIView.list()` method passes `queryset` to `get_serializer`, so the context (including request) is automatically passed.

However, with `sorted()` returning a list, `self.paginate_queryset(queryset)` (called in `list()`) still works — Django REST Framework's pagination handles lists.

### Step 3 — Update `ExamStartView`

In `apps/backend/apps/exams/exam_views.py`, update the exam_set access check:

Current code (line 80-81):
```python
exam_set = ExamSet.objects.select_related("certification").get(pk=exam_set_id)
if exam_set.is_locked:
    return Response({"detail": "Exam set is locked."}, status=status.HTTP_403_FORBIDDEN)
```

New code:
```python
exam_set = ExamSet.objects.select_related("certification").get(pk=exam_set_id)
# Hard lock — always blocks
if exam_set.is_locked:
    return Response({"detail": "Exam set is locked."}, status=status.HTTP_403_FORBIDDEN)
# Paywall — check if user has purchased (free sets pass automatically)
if exam_set.price_credits > 0:
    from apps.questions.models import UserExamUnlock
    if not UserExamUnlock.objects.filter(user=request.user, exam_set=exam_set).exists():
        return Response(
            {"detail": "Purchase required to access this exam set."},
            status=status.HTTP_403_FORBIDDEN
        )
```

Add the import at the top of the file or use inline import as shown above. Inline import is acceptable given this is the only use point.

### Step 4 — Update `PracticeQuestionListView`

Current query (line 79-80 of views.py):
```python
qs = Question.objects.filter(
    models.Q(exam_set__is_locked=False) | models.Q(exam_set__isnull=True)
)
```

This shows questions from all unlocked sets in practice mode. We need to respect the paywall: only show questions from sets the user has actually unlocked (free or purchased), plus questions with no exam_set.

New query:
```python
def get_queryset(self):
    cert_id = self.request.query_params.get('certification_id')
    user = self.request.user

    # Get exam_set IDs the user can access:
    # 1. is_locked=False AND price_credits=0  →  free, accessible
    # 2. is_locked=False AND UserExamUnlock exists  →  purchased, accessible
    # Staff can access all unlocked sets
    if user.is_staff:
        accessible_sets = ExamSet.objects.filter(is_locked=False).values_list('id', flat=True)
    else:
        from apps.questions.models import UserExamUnlock
        purchased_set_ids = UserExamUnlock.objects.filter(
            user=user
        ).values_list('exam_set_id', flat=True)

        accessible_sets = ExamSet.objects.filter(
            is_locked=False
        ).filter(
            models.Q(price_credits=0) | models.Q(id__in=purchased_set_ids)
        ).values_list('id', flat=True)

    qs = Question.objects.filter(
        models.Q(exam_set_id__in=accessible_sets) | models.Q(exam_set__isnull=True)
    )
    if cert_id:
        qs = qs.filter(certification_id=cert_id)
    return qs.order_by('id')
```

Note: `UserExamUnlock` and `ExamSet` are already imported in `views.py` (from `.models`). Only `UserExamUnlock` needs to be added to the import list. Update the import line:
```python
from .models import AnswerReport, Bookmark, Certification, Comment, ExamSet, Question, UserExamUnlock
```

## Files Modified

1. `apps/backend/apps/questions/serializers.py`
   - `ExamSetSerializer`: add `is_unlocked` SerializerMethodField, add `price_credits` to `fields`

2. `apps/backend/apps/questions/views.py`
   - `ExamSetListView.get_queryset()`: no change to filter logic, but remove the staff short-circuit on serializer context (not needed — already works)
   - `PracticeQuestionListView.get_queryset()`: new paywall-aware query
   - Import: add `UserExamUnlock` to model imports

3. `apps/backend/apps/exams/exam_views.py`
   - `ExamStartView.post()`: add paywall check after is_locked check

## Success Criteria

1. `GET /api/v1/questions/certifications/1/sets/` for a user with no purchases: paid sets appear with `is_unlocked: false`, free sets with `is_unlocked: true`
2. `GET /api/v1/questions/certifications/1/sets/` for staff: all sets returned (locked and unlocked)
3. `POST /api/v1/exams/start/` with a paid set ID and no purchase returns 403 "Purchase required"
4. `POST /api/v1/exams/start/` with a paid set the user purchased returns 201 (exam starts)
5. `GET /api/v1/questions/practice/` only returns questions from sets user can access

## Risk Assessment

- **N+1 in `get_is_unlocked`**: Each `ExamSet` in the list triggers a `UserExamUnlock` query. With potentially 50+ exam sets, this is 50 queries. Mitigation: prefetch `unlocks` for the current user in `ExamSetListView.get_queryset()` and cache in the serializer context. Simple approach: pass a pre-built set of unlocked IDs via serializer context. 

  Implementation: in `ExamSetListView`, override `get_serializer_context()`:
  ```python
  def get_serializer_context(self):
      context = super().get_serializer_context()
      if self.request.user.is_authenticated and not self.request.user.is_staff:
          from apps.questions.models import UserExamUnlock
          context['unlocked_ids'] = set(
              UserExamUnlock.objects.filter(user=self.request.user)
              .values_list('exam_set_id', flat=True)
          )
      return context
  ```
  Then in serializer's `get_is_unlocked`:
  ```python
  def get_is_unlocked(self, obj):
      request = self.context.get('request')
      if not request or not request.user.is_authenticated:
          return False
      if request.user.is_staff:
          return True
      if obj.price_credits == 0:
          return True
      unlocked_ids = self.context.get('unlocked_ids', set())
      return obj.id in unlocked_ids
  ```
  This reduces N+1 to a single pre-fetch query.

- **`sorted()` on queryset**: The `sorted()` call materializes the queryset to a list. This is existing behavior (not introduced by this phase). Keep as-is.
