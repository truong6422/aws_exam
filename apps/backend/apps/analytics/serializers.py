"""Analytics serializers — computed data, no models."""
from rest_framework import serializers


class RecentTrendItemSerializer(serializers.Serializer):
    date = serializers.DateTimeField()
    score = serializers.DecimalField(max_digits=5, decimal_places=2)
    certification_code = serializers.CharField()


class OverviewSerializer(serializers.Serializer):
    total_attempts = serializers.IntegerField()
    total_submitted = serializers.IntegerField()
    avg_score = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    best_score = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    recent_trend = RecentTrendItemSerializer(many=True)




class HistoryItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    certification_code = serializers.CharField()
    certification_name = serializers.CharField()
    started_at = serializers.DateTimeField()
    submitted_at = serializers.DateTimeField(allow_null=True)
    status = serializers.CharField()
    score_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    total_questions = serializers.IntegerField()
    correct_count = serializers.IntegerField(allow_null=True)
