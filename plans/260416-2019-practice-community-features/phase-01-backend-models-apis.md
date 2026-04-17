---
phase: "01"
title: Backend Models, Migrations, APIs, Admin
status: pending
---

# Phase 01 — Backend Models, Migrations, APIs, Admin

## Acceptance Criteria

- [ ] `Comment`, `AnswerReport`, `Bookmark` models exist in `apps/backend/apps/questions/models.py`
- [ ] Migrations created and apply cleanly (`python manage.py migrate`)
- [ ] `GET /api/v1/questions/{question_id}/comments/` returns list of comments
- [ ] `POST /api/v1/questions/{question_id}/comments/` creates a comment (auth required)
- [ ] `POST /api/v1/questions/comments/{id}/upvote/` toggles upvote (auth required)
- [ ] `POST /api/v1/questions/{question_id}/bookmark/` toggles bookmark, returns `{"bookmarked": bool}`
- [ ] `GET /api/v1/questions/bookmarks/` returns `{"question_ids": [...]}`
- [ ] `POST /api/v1/questions/{question_id}/report/` creates report; duplicate returns HTTP 409
- [ ] `AnswerReport` registered in Django Admin with list_display, list_filter, status update
- [ ] All new endpoints return HTTP 401 for unauthenticated requests (except comment list = read-only public)
- [ ] `APITestCase` tests pass for all new endpoints

## File Ownership

```
apps/backend/apps/questions/models.py          # ADD 3 new models
apps/backend/apps/questions/serializers.py     # ADD serializers for Comment, AnswerReport, Bookmark
apps/backend/apps/questions/views.py           # ADD 5 new views
apps/backend/apps/questions/urls.py            # ADD new URL patterns
apps/backend/apps/questions/admin.py           # ADD AnswerReport admin
apps/backend/apps/questions/migrations/        # NEW migration file
apps/backend/apps/questions/tests/             # NEW test file
```

## Implementation Steps

### Step 1 — Add Models to `models.py`

Append after existing `Answer` class:

```python
class Comment(TimestampedModel):
    """Community comment on a question. Visible after answer reveal in Practice Mode."""

    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="comments"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="comments"
    )
    referenced_answer = models.ForeignKey(
        Answer, on_delete=models.SET_NULL, null=True, blank=True, related_name="comments"
    )
    body = models.TextField(max_length=2000)
    upvotes = models.ManyToManyField(
        settings.AUTH_USER_MODEL, blank=True, related_name="upvoted_comments"
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Comment by {self.author_id} on Q#{self.question_id}"


class AnswerReport(TimestampedModel):
    """User report flagging a question's answer as incorrect. Reviewed in Admin."""

    STATUS_PENDING = "pending"
    STATUS_REVIEWED = "reviewed"
    STATUS_DISMISSED = "dismissed"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_REVIEWED, "Reviewed"),
        (STATUS_DISMISSED, "Dismissed"),
    ]

    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="reports"
    )
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reports"
    )
    reason = models.TextField(max_length=1000)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)

    class Meta:
        unique_together = ("question", "reporter")
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Report by {self.reporter_id} on Q#{self.question_id} [{self.status}]"


class Bookmark(models.Model):
    """User bookmark on a question for later review."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookmarks"
    )
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="bookmarks"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "question")

    def __str__(self) -> str:
        return f"Bookmark by {self.user_id} on Q#{self.question_id}"
```

Add `from django.conf import settings` at the top of `models.py`.

### Step 2 — Add Serializers to `serializers.py`

```python
from .models import Comment, AnswerReport, Bookmark

class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    upvote_count = serializers.SerializerMethodField()
    upvoted_by_me = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ["id", "body", "referenced_answer", "author_name", "upvote_count", "upvoted_by_me", "created_at"]
        read_only_fields = ["id", "author_name", "upvote_count", "upvoted_by_me", "created_at"]

    def get_author_name(self, obj):
        return obj.author.get_full_name() or obj.author.email.split("@")[0]

    def get_upvote_count(self, obj):
        return obj.upvotes.count()

    def get_upvoted_by_me(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.upvotes.filter(pk=request.user.pk).exists()
        return False


class AnswerReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnswerReport
        fields = ["id", "reason"]


class BookmarkListSerializer(serializers.Serializer):
    question_ids = serializers.ListField(child=serializers.IntegerField())
```

### Step 3 — Add Views to `views.py`

```python
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.shortcuts import get_object_or_404
from .models import Question, Comment, AnswerReport, Bookmark
from .serializers import CommentSerializer, AnswerReportSerializer, BookmarkListSerializer


class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        question_id = self.kwargs["question_id"]
        return Comment.objects.filter(question_id=question_id).select_related("author")

    def perform_create(self, serializer):
        question = get_object_or_404(Question, pk=self.kwargs["question_id"])
        serializer.save(author=self.request.user, question=question)


class CommentUpvoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        comment = get_object_or_404(Comment, pk=pk)
        user = request.user
        if comment.upvotes.filter(pk=user.pk).exists():
            comment.upvotes.remove(user)
            upvoted = False
        else:
            comment.upvotes.add(user)
            upvoted = True
        return Response({"upvoted": upvoted, "upvote_count": comment.upvotes.count()})


class BookmarkToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, question_id):
        question = get_object_or_404(Question, pk=question_id)
        bookmark, created = Bookmark.objects.get_or_create(user=request.user, question=question)
        if not created:
            bookmark.delete()
            return Response({"bookmarked": False})
        return Response({"bookmarked": True}, status=status.HTTP_201_CREATED)


class BookmarkListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ids = list(Bookmark.objects.filter(user=request.user).values_list("question_id", flat=True))
        return Response({"question_ids": ids})


class AnswerReportCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, question_id):
        question = get_object_or_404(Question, pk=question_id)
        if AnswerReport.objects.filter(question=question, reporter=request.user).exists():
            return Response(
                {"detail": "You have already reported this question."},
                status=status.HTTP_409_CONFLICT,
            )
        serializer = AnswerReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(question=question, reporter=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
```

### Step 4 — Add URL Patterns to `urls.py`

```python
from .views import (
    CertificationListView, DomainListView,
    CommentListCreateView, CommentUpvoteView,
    BookmarkToggleView, BookmarkListView,
    AnswerReportCreateView,
)

urlpatterns = [
    path("certifications/", CertificationListView.as_view(), name="certification-list"),
    path("certifications/<int:certification_id>/domains/", DomainListView.as_view(), name="domain-list"),
    # Comments
    path("<int:question_id>/comments/", CommentListCreateView.as_view(), name="comment-list-create"),
    path("comments/<int:pk>/upvote/", CommentUpvoteView.as_view(), name="comment-upvote"),
    # Bookmarks
    path("<int:question_id>/bookmark/", BookmarkToggleView.as_view(), name="bookmark-toggle"),
    path("bookmarks/", BookmarkListView.as_view(), name="bookmark-list"),
    # Reports
    path("<int:question_id>/report/", AnswerReportCreateView.as_view(), name="answer-report-create"),
]
```

Note: prefix `<int:question_id>/` captures question-scoped routes; `bookmarks/` and `comments/<int:pk>/upvote/` are not question-scoped. Ensure ordering: `bookmarks/` BEFORE `<int:question_id>/bookmark/` to avoid ambiguity.

### Step 5 — Register `AnswerReport` in `admin.py`

```python
from .models import Answer, Certification, Domain, Question, AnswerReport

@admin.register(AnswerReport)
class AnswerReportAdmin(admin.ModelAdmin):
    list_display = ["question_preview", "reporter", "status", "created_at"]
    list_filter = ["status"]
    search_fields = ["question__text", "reporter__email"]
    readonly_fields = ["question", "reporter", "reason", "created_at"]
    actions = ["mark_reviewed", "mark_dismissed"]

    @admin.display(description="Question")
    def question_preview(self, obj):
        return str(obj.question)[:80]

    @admin.action(description="Mark selected as Reviewed")
    def mark_reviewed(self, request, queryset):
        queryset.update(status=AnswerReport.STATUS_REVIEWED)

    @admin.action(description="Mark selected as Dismissed")
    def mark_dismissed(self, request, queryset):
        queryset.update(status=AnswerReport.STATUS_DISMISSED)
```

### Step 6 — Generate Migration

```bash
cd apps/backend
python manage.py makemigrations questions --name add_comment_answerreport_bookmark
python manage.py migrate
```

### Step 7 — Write Tests

Create `apps/backend/apps/questions/tests/test_community_apis.py`:

```python
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.questions.models import Question, Comment, Bookmark, AnswerReport
# Use baker or factories for object creation

User = get_user_model()


class CommentAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="a@test.com", password="pass")
        # create minimal question via baker or fixture

    def test_list_comments_unauthenticated(self):
        # GET /questions/{id}/comments/ returns 200 without auth
        ...

    def test_create_comment_requires_auth(self):
        # POST without auth → 401
        ...

    def test_create_comment(self):
        self.client.force_authenticate(self.user)
        # POST with body → 201, comment in DB
        ...

    def test_upvote_toggle(self):
        self.client.force_authenticate(self.user)
        # POST upvote → upvoted=True; POST again → upvoted=False
        ...


class BookmarkAPITest(APITestCase):
    def test_toggle_creates_then_deletes(self): ...
    def test_list_returns_question_ids(self): ...


class AnswerReportAPITest(APITestCase):
    def test_create_report(self): ...
    def test_duplicate_report_returns_409(self): ...
```
