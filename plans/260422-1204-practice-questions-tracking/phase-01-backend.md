---
phase: 01
title: Backend — Model, API, Migration, Dashboard Stats
status: pending
---

# Phase 01 — Backend

## Tasks

### 1. Add `PracticeQuestionView` model

**File:** `apps/backend/apps/questions/models.py`

Add at end of file:

```python
class PracticeQuestionView(models.Model):
    """Records unique practice question views per user (one row per user+question pair)."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="practice_views",
    )
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="practice_views"
    )
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "question")

    def __str__(self) -> str:
        return f"PracticeView: {self.user_id} → Q#{self.question_id}"
```

### 2. Add `PracticeViewedView` endpoint

**File:** `apps/backend/apps/questions/views.py`

Import `PracticeQuestionView` in the models import line.

Add new view class:

```python
class PracticeViewedView(APIView):
    """POST /api/v1/questions/practice/viewed/ — record that user viewed an answer."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        question_id = request.data.get("question_id")
        if not question_id:
            return Response({"detail": "question_id required."}, status=status.HTTP_400_BAD_REQUEST)

        question = get_object_or_404(Question, pk=question_id)
        _, created = PracticeQuestionView.objects.get_or_create(
            user=request.user, question=question
        )
        total = PracticeQuestionView.objects.filter(user=request.user).count()
        return Response({"created": created, "total_practice_views": total})
```

### 3. Wire URL

**File:** `apps/backend/apps/questions/urls.py`

- Import `PracticeViewedView`
- Add route **before** `<int:question_id>/` patterns:

```python
path("practice/viewed/", PracticeViewedView.as_view(), name="practice-viewed"),
```

### 4. Create migration

Run:
```bash
cd apps/backend && python manage.py makemigrations questions --name practicequestionview
```

Expected output: `0008_practicequestionview.py`

### 5. Update `dashboard_stats`

**File:** `apps/backend/apps/accounts/admin_views.py`

- Import `PracticeQuestionView` from `apps.questions.models`
- In the `dashboard_stats` action, add:

```python
from apps.questions.models import Certification, Question, ExamSet, PracticeQuestionView
from apps.exams.models import AttemptAnswer, ExamAttempt

# inside dashboard_stats:
total_exam_answers = AttemptAnswer.objects.count()
total_practice_views = PracticeQuestionView.objects.count()
total_questions_done = total_exam_answers + total_practice_views
```

- Add to `Response` dict:

```python
"total_questions_done": total_questions_done,
```

## Acceptance Criteria

- [ ] `PracticeQuestionView` table created in DB after migration
- [ ] `POST /api/v1/questions/practice/viewed/` returns `{"created": true, "total_practice_views": N}` on first call
- [ ] Second call with same question returns `{"created": false, "total_practice_views": N}` (same N)
- [ ] Unauthenticated call returns 401
- [ ] `GET /api/v1/auth/users/dashboard_stats/` includes `total_questions_done` field
