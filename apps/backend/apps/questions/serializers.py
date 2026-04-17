"""
Question serializers split by context:
- Exam: hides is_correct and explanation (anti-cheat)
- Review: exposes all fields for post-exam review
- Community: Comment, AnswerReport
"""
from rest_framework import serializers

from .models import Answer, AnswerReport, Certification, Comment, Domain, Question


class AnswerExamSerializer(serializers.ModelSerializer):
    """Answer fields safe for exam mode — NO is_correct."""

    class Meta:
        model = Answer
        fields = ["id", "text"]


class AnswerReviewSerializer(serializers.ModelSerializer):
    """Answer fields for post-exam review — includes is_correct."""

    class Meta:
        model = Answer
        fields = ["id", "text", "is_correct"]


class QuestionExamSerializer(serializers.ModelSerializer):
    """Question fields for exam mode — no explanation, no correct answers."""

    answers = AnswerExamSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ["id", "text", "question_type", "answers"]


class QuestionReviewSerializer(serializers.ModelSerializer):
    """Question fields for review — includes explanation and correct answers."""

    answers = AnswerReviewSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ["id", "text", "explanation", "question_type", "answers"]


class CertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certification
        fields = [
            "id",
            "code",
            "name",
            "description",
            "time_limit_minutes",
            "total_questions",
            "passing_score",
        ]


class DomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = Domain
        fields = ["id", "name", "weight_percentage", "certification"]


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    upvote_count = serializers.SerializerMethodField()
    upvoted_by_me = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            "id",
            "body",
            "referenced_answer",
            "author_name",
            "upvote_count",
            "upvoted_by_me",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "author_name",
            "upvote_count",
            "upvoted_by_me",
            "created_at",
        ]

    def get_author_name(self, obj):
        full_name = obj.author.get_full_name()
        return full_name if full_name else obj.author.email.split("@")[0]

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
