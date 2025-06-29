from django.contrib import admin
from api.models import *

# Register your models here.
admin.site.register(Category)
admin.site.register(Brand)
admin.site.register(Product)
admin.site.register(Review)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(ShippingAddress)


@admin.register(PayboxWallet)
class PayboxWalletAdmin(admin.ModelAdmin):
    list_display = ['user', 'balance', 'is_active', 'created_at', 'updated_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(PayboxTransaction)
class PayboxTransactionAdmin(admin.ModelAdmin):
    list_display = ['wallet', 'transaction_type', 'amount', 'status', 'created_at']
    list_filter = ['transaction_type', 'status', 'created_at']
    search_fields = ['wallet__user__username', 'description', 'stripe_payment_intent_id']
    readonly_fields = ['created_at', 'updated_at', 'balance_before', 'balance_after']
    raw_id_fields = ['wallet', 'order']
