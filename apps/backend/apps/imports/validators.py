"""JSON schema + business logic validation for bulk question import."""
import jsonschema

from apps.questions.models import Certification

QUESTION_IMPORT_SCHEMA = {
    "type": "object",
    "required": ["certification_code", "questions"],
    "properties": {
        "certification_code": {"type": "string", "minLength": 1},
        "questions": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "object",
                "required": ["text", "answers"],
                "properties": {
                    "text": {"type": "string", "minLength": 10},
                    "explanation": {"type": "string"},
                    "source": {"type": "string"},
                    "question_type": {"enum": ["single", "multiple"]},
                    "answers": {
                        "type": "array",
                        "minItems": 2,
                        "items": {
                            "type": "object",
                            "required": ["text", "is_correct"],
                            "properties": {
                                "text": {"type": "string", "minLength": 1},
                                "is_correct": {"type": "boolean"},
                            },
                        },
                    },
                },
            },
        },
    },
}


def validate_import_data(data):
    """Validate import payload.

    Returns:
        (is_valid: bool, errors: list[str])
    """
    # 1. Schema validation — fail fast
    try:
        jsonschema.validate(instance=data, schema=QUESTION_IMPORT_SCHEMA)
    except jsonschema.ValidationError as e:
        return False, [f"Schema error: {e.message}"]

    cert_code = data.get("certification_code")

    # 2. DB existence checks
    try:
        Certification.objects.get(code=cert_code)
    except Certification.DoesNotExist:
        return False, [f"Certification '{cert_code}' not found"]

    # 3. Business logic: correct-answer counts per question
    errors = []
    for i, q in enumerate(data.get("questions", [])):
        q_type = q.get("question_type", "single")
        answers = q.get("answers", [])
        correct_count = sum(1 for a in answers if a.get("is_correct"))

        if q_type == "single" and correct_count != 1:
            errors.append(
                f"Question {i + 1}: single-type must have exactly 1 correct answer "
                f"(found {correct_count})"
            )
        elif q_type == "multiple" and correct_count < 2:
            errors.append(
                f"Question {i + 1}: multiple-type must have >= 2 correct answers "
                f"(found {correct_count})"
            )

    return len(errors) == 0, errors
