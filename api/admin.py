from django.contrib import admin
from django.utils import timezone
from .models import Product, Order, RefundRequest, PayboxWallet, PayboxTransaction, Color, Size, ProductVariant

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

@admin.register(Color)
class ColorAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'hex_code']
    search_fields = ['name']


@admin.register(Size)
class SizeAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'order']
    search_fields = ['name']
    ordering = ['order', 'name']


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1
    fields = ['color', 'size', 'price', 'stock_quantity', 'sku', 'image']
    readonly_fields = ['sku']


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ['id', 'product', 'color', 'size', 'price', 'stock_quantity', 'sku']
    list_filter = ['color', 'size', 'product__category']
    search_fields = ['product__name', 'color__name', 'size__name', 'sku']
    readonly_fields = ['sku']


# Đăng ký các model khác nếu cần
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'price', 'has_variants', 'get_total_stock']
    search_fields = ['name']
    list_filter = ['has_variants', 'category', 'brand']
    inlines = [ProductVariantInline]

    def get_total_stock(self, obj):
        return obj.get_total_stock()
    get_total_stock.short_description = 'Tổng tồn kho'


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'isPaid', 'isDelivered', 'isRefunded', 'createdAt']
    list_filter = ['isPaid', 'isDelivered', 'isRefunded']
    search_fields = ['user__username']
