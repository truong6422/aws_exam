# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('questions', '0009_feedback'),
    ]

    operations = [
        migrations.AlterField(
            model_name='feedback',
            name='comment',
            field=models.TextField(blank=True, max_length=5000),
        ),
    ]
