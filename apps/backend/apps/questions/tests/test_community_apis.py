"""
Tests for community API endpoints: comments, upvotes, bookmarks, answer reports.
"""
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.questions.models import (
    Answer,
    AnswerReport,
    Bookmark,
    Certification,
    Comment,
    Question,
)

User = get_user_model()


def make_question():
    """Create a minimal question fixture."""
    cert = Certification.objects.create(
        code="TST-001", name="Test Cert", description="", time_limit_minutes=90
    )
    question = Question.objects.create(certification=cert, text="Test question?")
    Answer.objects.create(question=question, text="Option A", is_correct=True)
    Answer.objects.create(question=question, text="Option B", is_correct=False)
    return question


class CommentAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="user_a", email="a@test.com", password="pass123!")
        self.other = User.objects.create_user(username="user_b", email="b@test.com", password="pass123!")
        self.question = make_question()

    def test_list_comments_unauthenticated(self):
        url = f"/api/v1/questions/{self.question.id}/comments/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_comment_requires_auth(self):
        url = f"/api/v1/questions/{self.question.id}/comments/"
        response = self.client.post(url, {"body": "test"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_comment(self):
        self.client.force_authenticate(self.user)
        url = f"/api/v1/questions/{self.question.id}/comments/"
        response = self.client.post(url, {"body": "I chose A because..."})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Comment.objects.count(), 1)
        self.assertEqual(response.data["body"], "I chose A because...")

    def test_upvote_toggle(self):
        self.client.force_authenticate(self.user)
        comment = Comment.objects.create(
            question=self.question, author=self.other, body="Good point"
        )
        url = f"/api/v1/questions/comments/{comment.id}/upvote/"
        # First upvote
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["upvoted"])
        self.assertEqual(response.data["upvote_count"], 1)
        # Second call removes upvote
        response = self.client.post(url)
        self.assertFalse(response.data["upvoted"])
        self.assertEqual(response.data["upvote_count"], 0)

    def test_upvote_requires_auth(self):
        comment = Comment.objects.create(
            question=self.question, author=self.user, body="test"
        )
        url = f"/api/v1/questions/comments/{comment.id}/upvote/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class BookmarkAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="user_c", email="c@test.com", password="pass123!")
        self.question = make_question()

    def test_toggle_creates_then_deletes(self):
        self.client.force_authenticate(self.user)
        url = f"/api/v1/questions/{self.question.id}/bookmark/"
        # Create
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["bookmarked"])
        self.assertEqual(Bookmark.objects.count(), 1)
        # Delete
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["bookmarked"])
        self.assertEqual(Bookmark.objects.count(), 0)

    def test_list_returns_question_ids(self):
        self.client.force_authenticate(self.user)
        Bookmark.objects.create(user=self.user, question=self.question)
        response = self.client.get("/api/v1/questions/bookmarks/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(self.question.id, response.data["question_ids"])

    def test_bookmark_requires_auth(self):
        url = f"/api/v1/questions/{self.question.id}/bookmark/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AnswerReportAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="user_d", email="d@test.com", password="pass123!")
        self.question = make_question()

    def test_create_report(self):
        self.client.force_authenticate(self.user)
        url = f"/api/v1/questions/{self.question.id}/report/"
        response = self.client.post(url, {"reason": "Answer B should be correct"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(AnswerReport.objects.count(), 1)

    def test_duplicate_report_returns_409(self):
        self.client.force_authenticate(self.user)
        url = f"/api/v1/questions/{self.question.id}/report/"
        self.client.post(url, {"reason": "First report"})
        response = self.client.post(url, {"reason": "Second report"})
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_report_requires_auth(self):
        url = f"/api/v1/questions/{self.question.id}/report/"
        response = self.client.post(url, {"reason": "test"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
