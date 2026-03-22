"""
Question serializers split by context:
- Exam: hides is_correct and explanation (anti-cheat)
- Review: exposes all fields for post-exam review
"""
from rest_framework import serializers

from .models import Answer, Certification, Domain, Question


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
