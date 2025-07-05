from django.contrib import admin
from django.utils import timezone
from .models import Product, Order, RefundRequest, PayboxWallet, PayboxTransaction

# Action: Chấp nhận hoàn tiền
@admin.action(description="✅ Chấp nhận hoàn tiền")
def approve_refund(modeladmin, request, queryset):
    for refund in queryset:
        if refund.is_approved is None or refund.is_approved is False:
            refund.is_approved = True
            refund.approved_at = timezone.now()
            refund.save()

# Action: Từ chối hoàn tiền
@admin.action(description="❌ Từ chối hoàn tiền")
def reject_refund(modeladmin, request, queryset):
    for refund in queryset:
        if refund.is_approved is None or refund.is_approved is True:
            refund.is_approved = False
            refund.approved_at = timezone.now()
            refund.save()

@admin.register(RefundRequest)
class RefundRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'order', 'reason', 'is_approved', 'created_at', 'approved_at']
    list_filter = ['is_approved', 'created_at']
    search_fields = ['user__username', 'order__id', 'reason']
    readonly_fields = ['created_at']
    actions = [approve_refund, reject_refund]

@admin.register(PayboxWallet)
class PayboxWalletAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'balance']
    search_fields = ['user__username']

@admin.register(PayboxTransaction)
class PayboxTransactionAdmin(admin.ModelAdmin):
    list_display = ['id', 'wallet', 'amount', 'transaction_type', 'created_at']
    list_filter = ['transaction_type']
    search_fields = ['wallet__user__username']

# Đăng ký các model khác nếu cần
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'price']
    search_fields = ['name']

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'isPaid', 'isDelivered', 'isRefunded', 'createdAt']
    list_filter = ['isPaid', 'isDelivered', 'isRefunded']
    search_fields = ['user__username']
