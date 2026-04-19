#!/usr/bin/env python
"""
Test Django gettext translation loading.
"""
import os
import sys
import django
from pathlib import Path

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

django.setup()

from django.utils.translation import gettext as _
from django.utils.translation import activate, get_language

# Test translations
test_strings = [
    "A user with this email already exists.",
    "Passwords do not match.",
    "Current password is incorrect.",
    "Certification not found.",
    "Exam set not found.",
    "Either certification_id or exam_set_id is required.",
]

print("🔍 Testing Django Translations\n")
print(f"Current language: {get_language()}")
print(f"Available languages: en, vi\n")

# Test English (default)
print("📖 English Translations (default):")
for text in test_strings:
    translated = _(text)
    print(f"  • {text}")

print("\n📖 Vietnamese Translations (vi):")
activate('vi')
print(f"Current language: {get_language()}\n")

for text in test_strings:
    translated = _(text)
    print(f"  • {translated}")

print("\n✓ Translation test complete")
