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
    certification_id = serializers.IntegerField()

    def validate_certification_id(self, value):
        if not Certification.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Certification not found.")
        return value


class PartialAnswerSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    answer_ids = serializers.ListField(child=serializers.IntegerField(), allow_empty=True)


class CertificationBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certification
        fields = ['id', 'code', 'name']


class ExamAttemptListSerializer(serializers.ModelSerializer):
    certification = CertificationBriefSerializer(read_only=True)
    time_remaining_seconds = serializers.SerializerMethodField()

    class Meta:
        model = ExamAttempt
        fields = [
            'id', 'certification', 'started_at', 'submitted_at',
            'status', 'score_percentage', 'total_questions',
            'correct_count', 'time_remaining_seconds',
        ]

    def get_time_remaining_seconds(self, obj):
        return obj.time_remaining_seconds


class ExamAttemptDetailSerializer(serializers.ModelSerializer):
    certification = CertificationBriefSerializer(read_only=True)
    time_remaining_seconds = serializers.SerializerMethodField()
    questions = serializers.SerializerMethodField()

    class Meta:
        model = ExamAttempt
        fields = [
            'id', 'certification', 'started_at', 'time_limit_minutes',
            'status', 'total_questions', 'time_remaining_seconds', 'questions',
        ]

    def get_time_remaining_seconds(self, obj):
        return obj.time_remaining_seconds

    def get_questions(self, obj):
        from apps.questions.models import Question
        question_ids = obj.attempt_answers.values_list('question_id', flat=True)
        questions = Question.objects.filter(id__in=question_ids).prefetch_related('answers')
        return QuestionExamSerializer(questions, many=True).data


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
