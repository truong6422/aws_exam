"""
Django admin registrations for the wallet app.
"""
from django.contrib import admin

from .models import CreditTransaction, SystemConfig, TopUpRequest, Wallet


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ['user', 'balance', 'updated_at']
    search_fields = ['user__email']
    readonly_fields = ['updated_at']


@admin.register(CreditTransaction)
class CreditTransactionAdmin(admin.ModelAdmin):
    list_display = ['wallet', 'delta', 'type', 'ref_id', 'note', 'created_at']
    list_filter = ['type']
    readonly_fields = ['wallet', 'delta', 'type', 'ref_id', 'note', 'created_at']
    search_fields = ['wallet__user__email', 'ref_id']


@admin.register(TopUpRequest)
class TopUpRequestAdmin(admin.ModelAdmin):
    list_display = ['user', 'transaction_code', 'amount_credits', 'amount_vnd', 'status', 'created_at']
    list_filter = ['status']
    readonly_fields = ['user', 'transaction_code', 'amount_credits', 'amount_vnd', 'created_at']
    search_fields = ['user__email', 'transaction_code']


@admin.register(SystemConfig)
class SystemConfigAdmin(admin.ModelAdmin):
    list_display = ['key', 'value', 'updated_at']
