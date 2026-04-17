"""
Exam session serializers split by context:
- StartExamSerializer: input validation
- ExamAttemptListSerializer: paginated list
- ExamAttemptDetailSerializer: full detail with questions (no is_correct)
- ExamSubmitResponseSerializer: submit result
- ExamReviewSerializer: post-exam review with correct answers
"""
from rest_framework import serializers

from apps.questions.models import Certification
from apps.questions.serializers import QuestionExamSerializer, QuestionReviewSerializer

from .models import AttemptAnswer, ExamAttempt


class StartExamSerializer(serializers.Serializer):
    """Input for starting an exam. Prefers exam_set_id."""

    certification_id = serializers.IntegerField(required=False, allow_null=True)
    exam_set_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_certification_id(self, value):
        if value and not Certification.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Certification not found.")
        return value

    def validate_exam_set_id(self, value):
        from apps.questions.models import ExamSet
        if value and not ExamSet.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Exam set not found.")
        return value

    def validate(self, data):
        if not data.get('certification_id') and not data.get('exam_set_id'):
            raise serializers.ValidationError("Either certification_id or exam_set_id is required.")
        return data


class PartialAnswerSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    answer_ids = serializers.ListField(child=serializers.IntegerField(), allow_empty=True)
    is_flagged = serializers.BooleanField(required=False, default=False)


class CertificationBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certification
        fields = ['id', 'code', 'name']


class ExamAttemptListSerializer(serializers.ModelSerializer):
    certification = CertificationBriefSerializer(read_only=True)
    time_remaining_seconds = serializers.SerializerMethodField()
    answered_count = serializers.SerializerMethodField()
    time_spent_seconds = serializers.SerializerMethodField()
    exam_set_id = serializers.IntegerField(read_only=True, allow_null=True)

    class Meta:
        model = ExamAttempt
        fields = [
            'id', 'certification', 'exam_set_id', 'started_at', 'submitted_at',
            'status', 'score_percentage', 'total_questions',
            'correct_count', 'time_remaining_seconds',
            'answered_count', 'time_spent_seconds',
        ]

    def get_time_remaining_seconds(self, obj):
        return obj.time_remaining_seconds

    def get_answered_count(self, obj):
        return obj.attempt_answers.exclude(selected_answers=None).filter(
            selected_answers__isnull=False
        ).distinct().count()

    def get_time_spent_seconds(self, obj):
        return obj.time_spent_total


class ExamAttemptDetailSerializer(serializers.ModelSerializer):
    certification = CertificationBriefSerializer(read_only=True)
    time_remaining_seconds = serializers.SerializerMethodField()
    questions = serializers.SerializerMethodField()
    user_answers = serializers.SerializerMethodField()
    flagged_ids = serializers.SerializerMethodField()

    class Meta:
        model = ExamAttempt
        fields = [
            'id', 'certification', 'started_at', 'time_limit_minutes',
            'status', 'total_questions', 'time_remaining_seconds', 'questions',
            'user_answers', 'flagged_ids',
        ]

    def get_time_remaining_seconds(self, obj):
        return obj.time_remaining_seconds

    def get_questions(self, obj):
        from apps.questions.models import Question
        question_ids = obj.attempt_answers.values_list('question_id', flat=True)
        questions = Question.objects.filter(id__in=question_ids).prefetch_related('answers')
        return QuestionExamSerializer(questions, many=True).data

    def get_user_answers(self, obj):
        result = {}
        for aa in obj.attempt_answers.prefetch_related('selected_answers'):
            result[str(aa.question_id)] = list(
                aa.selected_answers.values_list('id', flat=True)
            )
        return result

    def get_flagged_ids(self, obj):
        return list(obj.attempt_answers.filter(is_flagged=True).values_list('question_id', flat=True))


class ExamSubmitResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamAttempt
        fields = ['id', 'score_percentage', 'correct_count', 'total_questions', 'status', 'submitted_at']


class ExamReviewSerializer(serializers.ModelSerializer):
    certification = CertificationBriefSerializer(read_only=True)
    questions = serializers.SerializerMethodField()
    user_answers = serializers.SerializerMethodField()

    class Meta:
        model = ExamAttempt
        fields = [
            'id', 'certification', 'score_percentage', 'correct_count',
            'total_questions', 'questions', 'user_answers',
        ]

    def get_questions(self, obj):
        from apps.questions.models import Question
        question_ids = obj.attempt_answers.values_list('question_id', flat=True)
        questions = Question.objects.filter(id__in=question_ids).prefetch_related('answers')
        return QuestionReviewSerializer(questions, many=True).data

    def get_user_answers(self, obj):
        result = {}
        for aa in obj.attempt_answers.prefetch_related('selected_answers'):
            result[str(aa.question_id)] = list(
                aa.selected_answers.values_list('id', flat=True)
            )
        return result
