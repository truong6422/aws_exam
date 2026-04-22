from django.urls import path

from .views import (
    AnswerReportCreateView,
    BookmarkListView,
    BookmarkToggleView,
    CertificationListView,
    CommentListCreateView,
    CommentUpvoteView,
    ExamSetListView,
    ExamSetUpdateView,
    ExamSetBulkUpdateView,
    ExamSetFreeIncompleteView,
    PracticeQuestionListView,
    PracticeViewedView,
)
from apps.wallet.purchase_views import ExamSetPurchaseView

app_name = "questions"

urlpatterns = [
    path("practice/", PracticeQuestionListView.as_view(), name="practice-question-list"),
    path("practice/viewed/", PracticeViewedView.as_view(), name="practice-viewed"),
    path("certifications/", CertificationListView.as_view(), name="certification-list"),
    path(
        "certifications/<int:certification_id>/sets/",
        ExamSetListView.as_view(),
        name="exam-set-list",
    ),
    path("sets/<int:pk>/", ExamSetUpdateView.as_view(), name="exam-set-update"),
    path("sets/bulk-update/", ExamSetBulkUpdateView.as_view(), name="exam-set-bulk-update"),
    path("sets/free-incomplete/", ExamSetFreeIncompleteView.as_view(), name="exam-set-free-incomplete"),
    path("sets/<int:pk>/purchase/", ExamSetPurchaseView.as_view(), name="exam-set-purchase"),
    # Bookmarks (non-question-scoped must come before <int:question_id> patterns)
    path("bookmarks/", BookmarkListView.as_view(), name="bookmark-list"),
    # Comment upvote (non-question-scoped)
    path(
        "comments/<int:pk>/upvote/",
        CommentUpvoteView.as_view(),
        name="comment-upvote",
    ),
    # Question-scoped community routes
    path(
        "<int:question_id>/comments/",
        CommentListCreateView.as_view(),
        name="comment-list-create",
    ),
    path(
        "<int:question_id>/bookmark/",
        BookmarkToggleView.as_view(),
        name="bookmark-toggle",
    ),
    path(
        "<int:question_id>/report/",
        AnswerReportCreateView.as_view(),
        name="answer-report-create",
    ),
]
