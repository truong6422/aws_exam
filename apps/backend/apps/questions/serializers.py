"""
Question serializers split by context:
- Exam: hides is_correct and explanation (anti-cheat)
- Review: exposes all fields for post-exam review
- Community: Comment, AnswerReport
"""
from rest_framework import serializers

from .models import Answer, AnswerReport, Certification, Comment, ExamSet, Question


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


class PracticeQuestionSerializer(serializers.ModelSerializer):
    """Question fields for practice mode — includes explanation and correct answers."""

    answers = AnswerReviewSerializer(many=True, read_only=True)
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = ["id", "text", "explanation", "question_type", "answers", "comment_count"]

    def get_comment_count(self, obj):
        return obj.comments.count()


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


class ExamSetSerializer(serializers.ModelSerializer):
    question_count = serializers.IntegerField(source="questions.count", read_only=True)
    is_unlocked = serializers.SerializerMethodField()

    class Meta:
        model = ExamSet
        fields = ["id", "name", "description", "is_locked", "price_credits", "question_count", "is_unlocked"]

    def get_is_unlocked(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        if request.user.is_staff:
            return True
        if obj.price_credits == 0:
            return True
        # Use cached set of unlocked IDs if available (N+1 mitigation)
        unlocked_ids = self.context.get("unlocked_ids")
        if unlocked_ids is not None:
            return obj.id in unlocked_ids

        from .models import UserExamUnlock
        return UserExamUnlock.objects.filter(user=request.user, exam_set=obj).exists()


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    upvote_count = serializers.SerializerMethodField()
    upvoted_by_me = serializers.SerializerMethodField()

    replies = serializers.SerializerMethodField()

    referenced_answers = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Answer.objects.all(), required=False
    )

    class Meta:
        model = Comment
        fields = [
            "id",
            "parent",
            "body",
            "referenced_answers",
            "author_name",
            "upvote_count",
            "upvoted_by_me",
            "replies",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "author_name",
            "upvote_count",
            "upvoted_by_me",
            "replies",
            "created_at",
        ]

    def get_replies(self, obj):
        # Only return flat list of replies for the top level to avoid deep nesting issues
        if obj.parent is None:
            return CommentSerializer(obj.replies.all(), many=True, context=self.context).data
        return []

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
