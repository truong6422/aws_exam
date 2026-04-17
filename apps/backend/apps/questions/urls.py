from django.urls import path

from .views import (
    AnswerReportCreateView,
    BookmarkListView,
    BookmarkToggleView,
    CertificationListView,
    CommentListCreateView,
    CommentUpvoteView,
    DomainListView,
)

app_name = "questions"

urlpatterns = [
    path("certifications/", CertificationListView.as_view(), name="certification-list"),
    path(
        "certifications/<int:certification_id>/domains/",
        DomainListView.as_view(),
        name="domain-list",
    ),
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
