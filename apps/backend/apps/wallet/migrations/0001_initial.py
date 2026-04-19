import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SystemConfig',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('key', models.CharField(max_length=100, unique=True)),
                ('value', models.TextField()),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'wallet_systemconfig',
            },
        ),
        migrations.CreateModel(
            name='Wallet',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('balance', models.PositiveIntegerField(default=0)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='wallet',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'db_table': 'wallet_wallet',
            },
        ),
        migrations.CreateModel(
            name='TopUpRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_by', models.BigIntegerField(blank=True, null=True)),
                ('updated_by', models.BigIntegerField(blank=True, null=True)),
                ('deleted_by', models.BigIntegerField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(blank=True, default=None, null=True)),
                ('deleted_at', models.DateTimeField(blank=True, default=None, null=True)),
                ('is_deleted', models.BooleanField(default=False)),
                ('amount_credits', models.PositiveIntegerField()),
                ('amount_vnd', models.PositiveIntegerField()),
                ('transaction_code', models.CharField(max_length=20, unique=True)),
                ('status', models.CharField(
                    choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')],
                    default='pending',
                    max_length=20,
                )),
                ('admin_note', models.TextField(blank=True)),
                ('approved_at', models.DateTimeField(blank=True, null=True)),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='topup_requests',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('approved_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='approved_topups',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'db_table': 'wallet_topuprequest',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='CreditTransaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_by', models.BigIntegerField(blank=True, null=True)),
                ('updated_by', models.BigIntegerField(blank=True, null=True)),
                ('deleted_by', models.BigIntegerField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(blank=True, default=None, null=True)),
                ('deleted_at', models.DateTimeField(blank=True, default=None, null=True)),
                ('is_deleted', models.BooleanField(default=False)),
                ('delta', models.IntegerField()),
                ('type', models.CharField(
                    choices=[
                        ('topup', 'Top Up'),
                        ('purchase', 'Purchase'),
                        ('admin_adjust', 'Admin Adjustment'),
                        ('refund', 'Refund'),
                    ],
                    max_length=20,
                )),
                ('ref_id', models.CharField(blank=True, max_length=100)),
                ('note', models.CharField(blank=True, max_length=500)),
                ('wallet', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='transactions',
                    to='wallet.wallet',
                )),
            ],
            options={
                'db_table': 'wallet_credittransaction',
                'ordering': ['-created_at'],
            },
        ),
    ]
