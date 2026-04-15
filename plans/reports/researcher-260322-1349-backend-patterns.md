# Django REST Framework Backend Patterns for Exam Engine

**Report Date**: 2026-03-22 | **Compiled for**: AWS Exam App MVP
**Tech Stack**: Django 5, DRF 3.15, djangorestframework-simplejwt 5.3, PostgreSQL, Redis

---

## 1. Question Bank Modeling (3NF Structure)

### Pattern
Strict normalized hierarchy without difficulty field:
- **Certification** (exam domain)
- **Domain** (subject area within certification)
- **Question** (question text + explanation)
- **Answer** (option with is_correct flag)

### Key Implementation

```python
# models.py
class Certification(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class Domain(models.Model):
    """Subject area within a certification"""
    certification = models.ForeignKey(Certification, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField()

    class Meta:
        unique_together = ('certification', 'name')

class Question(models.Model):
    domain = models.ForeignKey(Domain, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    explanation = models.TextField(blank=True)  # Post-exam explanation
    created_at = models.DateTimeField(auto_now_add=True)

class Answer(models.Model):
    """MCQ options - multiple answers possible for multi-select questions"""
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    text = models.CharField(max_length=500)
    is_correct = models.BooleanField()

    class Meta:
        unique_together = ('question', 'text')
```

### Why This Works
- **3NF compliance**: No transitive dependencies; each entity represents single concept
- **No difficulty**: Calculated post-attempt via spaced repetition algorithm (future phase)
- **Flexibility**: Supports multi-select questions (multiple is_correct=True)
- **PostgreSQL-native**: Standard FK relationships, no JSONB denormalization needed

---

## 2. Exam Session State Management

### Pattern
Server-side timer using `started_at` + `time_limit_minutes`, autosave via PATCH with partial answer array.

### Key Implementation

```python
# models.py
class ExamAttempt(models.Model):
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('submitted', 'Submitted'),
        ('graded', 'Graded'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE)
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True)
    time_limit_minutes = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')

    @property
    def time_remaining_seconds(self):
        """Server-side calculation - client NEVER trusts client time"""
        elapsed = (timezone.now() - self.started_at).total_seconds()
        remaining = max(0, (self.time_limit_minutes * 60) - elapsed)
        return int(remaining)

    @property
    def is_expired(self):
        return self.time_remaining_seconds == 0 and self.status == 'in_progress'

class AttemptAnswer(models.Model):
    """Stores partial answers during exam - maps question → answer choices"""
    attempt = models.ForeignKey(ExamAttempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_answers = models.ManyToManyField(Answer)  # For multi-select
    answered_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('attempt', 'question')
```

### Autosave Endpoint (PATCH)

```python
# serializers.py
class PartialAnswerSerializer(serializers.Serializer):
    """Partial update - only answer_ids required"""
    question_id = serializers.IntegerField()
    answer_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=True
    )

# views.py
class ExamAutosaveView(generics.GenericAPIView):
    """PATCH /exams/{attempt_id}/autosave/ - lightweight partial save"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, attempt_id):
        attempt = get_object_or_404(ExamAttempt, id=attempt_id, user=request.user)

        if attempt.is_expired:
            return Response({'error': 'Exam expired'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = PartialAnswerSerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)

        for item in serializer.validated_data:
            answer_obj, _ = AttemptAnswer.objects.get_or_create(
                attempt=attempt,
                question_id=item['question_id']
            )
            answer_obj.selected_answers.set(item['answer_ids'])

        return Response({
            'status': 'saved',
            'time_remaining_seconds': attempt.time_remaining_seconds
        })
```

### Critical Points
- **Server validates time**: Client timer is UI-only; always recalculate server-side
- **No session extension**: Auto-submit on expiry (async celery task if needed later)
- **Lightweight saves**: PATCH only sends delta, not full attempt state
- **Idempotent**: Repeated PATCH calls safe (get_or_create pattern)

---

## 3. Serializer Security Pattern

### Challenge
Hide `is_correct`, `explanation` from test-taker; expose for admins.

### Solution: Dynamic Serializers by Context

```python
# serializers.py

class AnswerExamSerializer(serializers.ModelSerializer):
    """Test-taker view - hides correct answer"""
    class Meta:
        model = Answer
        fields = ['id', 'text']  # NO is_correct field

class AnswerAdminSerializer(serializers.ModelSerializer):
    """Admin/review view - full data"""
    class Meta:
        model = Answer
        fields = ['id', 'text', 'is_correct']

class QuestionExamSerializer(serializers.ModelSerializer):
    """During exam - no explanation"""
    answers = AnswerExamSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'text', 'answers']

class QuestionReviewSerializer(serializers.ModelSerializer):
    """Post-exam review - show explanation"""
    answers = AnswerAdminSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'text', 'explanation', 'answers']

class QuestionAdminSerializer(serializers.ModelSerializer):
    """Admin edit view"""
    answers = AnswerAdminSerializer(many=True)

    class Meta:
        model = Question
        fields = ['id', 'domain', 'text', 'explanation', 'answers']

# views.py
class QuestionDetailView(generics.RetrieveAPIView):
    """Route to correct serializer based on context"""
    queryset = Question.objects.all()

    def get_serializer_class(self):
        request = self.request
        action = request.query_params.get('action', 'exam')  # ?action=review

        if request.user.is_staff or request.user.is_superuser:
            return QuestionAdminSerializer
        elif action == 'review':
            return QuestionReviewSerializer
        else:
            return QuestionExamSerializer
```

### Best Practice: Use Permissions + Serializers

```python
from rest_framework.permissions import BasePermission

class IsStaffOrReadOnlyExam(BasePermission):
    def has_permission(self, request, view):
        if request.method == 'GET':
            # GET for exam = safe data only
            return True
        # POST/PUT/DELETE = staff only
        return request.user and request.user.is_staff

class QuestionExamViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    permission_classes = [IsStaffOrReadOnlyExam]

    def get_serializer_class(self):
        if self.request.user.is_staff:
            return QuestionAdminSerializer
        return QuestionExamSerializer
```

---

## 4. JWT Redis Blacklist (JTI-Based)

### Why Not Default simplejwt Blacklist?
Default uses DB table (`TokenBlacklist`), causing:
- Unbounded table growth
- DB query on every request
- No automatic expiration

### Redis JTI Pattern

```python
# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {'max_connections': 50}
        }
    }
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'JTI_CLAIM': 'jti',
    # NO BLACKLIST_AFTER_ROTATION - we handle Redis manually
}

# Set in env
REDIS_TOKEN_BLACKLIST_KEY = 'token:blacklist:{jti}'
REDIS_BLACKLIST_TTL = 86400  # 24h (> refresh lifetime)
```

```python
# utils/token_utils.py
from django.core.cache import cache
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
import json

class TokenBlacklist:
    """Redis-backed JTI blacklist"""

    @staticmethod
    def blacklist_token(token_str):
        """Add JTI to Redis blacklist"""
        try:
            token = AccessToken(token_str)
            jti = token.get('jti')
            key = f'token:blacklist:{jti}'
            # Set with TTL = token exp time + buffer
            cache.set(key, True, timeout=86400)
        except Exception as e:
            # Token invalid - silently ignore
            pass

    @staticmethod
    def is_blacklisted(token_str):
        """Check if JTI is in Redis blacklist"""
        try:
            token = AccessToken(token_str)
            jti = token.get('jti')
            key = f'token:blacklist:{jti}'
            return cache.get(key) is not None
        except Exception:
            return False

# views.py - Logout
class LogoutView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '').split()
        if len(auth_header) == 2 and auth_header[0] == 'Bearer':
            token = auth_header[1]
            TokenBlacklist.blacklist_token(token)
        return Response({'detail': 'Successfully logged out'})
```

```python
# authentication.py - Custom auth class
from rest_framework_simplejwt.authentication import JWTAuthentication
from utils.token_utils import TokenBlacklist

class CustomJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            return result

        user, validated_token = result

        # Check Redis blacklist
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if TokenBlacklist.is_blacklisted(auth_header.split()[-1]):
            raise InvalidToken('Token is blacklisted')

        return (user, validated_token)

# settings.py
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'core.authentication.CustomJWTAuthentication',
    ]
}
```

### Monitoring Blacklist Size
```python
# management/commands/cleanup_expired_tokens.py
from django.core.management.base import BaseCommand
from django.core.cache import cache

class Command(BaseCommand):
    def handle(self, *args, **options):
        # Redis TTL handles cleanup automatically
        # This just logs stats if needed
        info = cache.get_or_set('blacklist:stats', {}, timeout=3600)
        self.stdout.write(f"Blacklist entries: {len(info)}")
```

---

## 5. Bulk Question Import with jsonschema Validation

### Pattern
Validate entire JSON before touching database; fail-fast on schema violations.

```python
# validators.py
import jsonschema
from typing import Dict, List, Any

QUESTION_IMPORT_SCHEMA = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
        "certification_id": {"type": "integer"},
        "domain_id": {"type": "integer"},
        "questions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "text": {"type": "string", "minLength": 10},
                    "explanation": {"type": "string"},
                    "answers": {
                        "type": "array",
                        "minItems": 2,
                        "items": {
                            "type": "object",
                            "properties": {
                                "text": {"type": "string"},
                                "is_correct": {"type": "boolean"}
                            },
                            "required": ["text", "is_correct"]
                        }
                    }
                },
                "required": ["text", "answers"]
            },
            "minItems": 1
        }
    },
    "required": ["certification_id", "domain_id", "questions"]
}

def validate_question_import(data: Dict[str, Any]) -> tuple[bool, str]:
    """
    Returns: (is_valid, error_message)
    """
    try:
        jsonschema.validate(instance=data, schema=QUESTION_IMPORT_SCHEMA)

        # Additional business logic validation
        cert = Certification.objects.get(id=data['certification_id'])
        domain = Domain.objects.get(id=data['domain_id'], certification=cert)

        return True, ""
    except jsonschema.ValidationError as e:
        return False, f"Schema validation failed: {e.message}"
    except Certification.DoesNotExist:
        return False, "Certification not found"
    except Domain.DoesNotExist:
        return False, "Domain not found for certification"
```

```python
# serializers.py
class BulkQuestionImportSerializer(serializers.Serializer):
    """Handle bulk import with validation"""
    data = serializers.JSONField()

    def validate_data(self, value):
        is_valid, error = validate_question_import(value)
        if not is_valid:
            raise serializers.ValidationError(error)
        return value

    def create(self, validated_data):
        """Atomic bulk create"""
        import_data = validated_data['data']

        created_questions = []
        try:
            with transaction.atomic():
                domain = Domain.objects.get(
                    id=import_data['domain_id'],
                    certification_id=import_data['certification_id']
                )

                for q in import_data['questions']:
                    question = Question.objects.create(
                        domain=domain,
                        text=q['text'],
                        explanation=q.get('explanation', '')
                    )

                    for a in q['answers']:
                        Answer.objects.create(
                            question=question,
                            text=a['text'],
                            is_correct=a['is_correct']
                        )

                    created_questions.append(question)
        except Exception as e:
            raise serializers.ValidationError(f"Bulk import failed: {str(e)}")

        return {'count': len(created_questions), 'questions': created_questions}
```

```python
# views.py
class BulkQuestionImportView(generics.CreateAPIView):
    serializer_class = BulkQuestionImportSerializer
    permission_classes = [IsAuthenticated, IsStaff]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        return Response(
            {'message': f"Imported {result['count']} questions"},
            status=status.HTTP_201_CREATED
        )
```

### Import Endpoint Usage
```bash
curl -X POST http://localhost:8000/api/questions/import/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d @questions.json
```

---

## Summary Table

| Pattern | Implementation | Pro | Con |
|---------|---|---|---|
| **3NF Model** | Certification → Domain → Question → Answer | No denormalization, PostgreSQL-native | 4 tables, complex queries |
| **Session State** | started_at + time_limit_minutes, server-side calc | Tamper-proof, lightweight | Requires timer logic on client |
| **Serializer Split** | get_serializer_class() + Permissions | Clean separation, reusable | More classes to maintain |
| **JWT Blacklist** | Redis JTI with TTL | Fast, auto-cleanup, scalable | Requires Redis infrastructure |
| **Bulk Import** | jsonschema + atomic transaction | Fail-fast, all-or-nothing | Extra validation layer |

---

## Unresolved Questions

1. **Spaced repetition difficulty scoring**: Should difficulty be calculated async post-exam, or cached in a separate analytics table?
2. **Exam revision history**: Should attempted answers be immutable, or allow correction before submission?
3. **Multi-domain exams**: Does an exam span multiple domains? If so, weight scoring?
4. **Batch blacklist cleanup**: Should Redis blacklist have scheduled cleanup, or rely on TTL?
5. **PDF question import**: Will you support PDF → JSON → bulk import workflow, or text-based only?
