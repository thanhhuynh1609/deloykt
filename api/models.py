
from django.db import models
from django.conf import settings
from django.core.validators import MaxValueValidator
from decimal import Decimal
from django.utils import timezone
import logging;
from django.contrib.auth.models import User
# Create your models here.
import logging


class Category(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=False)
    image = models.ImageField(null=True, blank=True, default='/placeholder.png')
    featured_product = models.ForeignKey('Product', on_delete=models.SET_NULL, null=True, related_name='+', blank=True)

    def __str__(self) -> str:
        return self.title



class Brand(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    image = models.ImageField(null=True, blank=True, default='/placeholder.png')
    featured_product = models.ForeignKey('Product', on_delete=models.SET_NULL, null=True, related_name='+', blank=True)

    def __str__(self) -> str:
        return self.title


class Color(models.Model):
    name = models.CharField(max_length=50, unique=True)
    hex_code = models.CharField(max_length=7, help_text="Mã màu hex (ví dụ: #FF0000)")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Màu sắc"
        verbose_name_plural = "Màu sắc"


class Size(models.Model):
    name = models.CharField(max_length=10, unique=True)
    order = models.IntegerField(default=0, help_text="Thứ tự hiển thị")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Kích cỡ"
        verbose_name_plural = "Kích cỡ"
        ordering = ['order', 'name']


class Product(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    name = models.CharField(max_length=200, null=True, blank=True)
    image = models.ImageField(null=True, blank=True, default='/placeholder.png')
    brand = models.ForeignKey(Brand, on_delete=models.PROTECT)
    category = models.ForeignKey(Category, on_delete=models.PROTECT)
    description = models.TextField(null=True, blank=True)
    rating = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    numReviews = models.IntegerField(null=True, blank=True, default=0)
    price = models.DecimalField(max_digits=12, decimal_places=0, null=True, blank=True)
    countInStock = models.IntegerField(null=True, blank=True, default=0)
    createdAt = models.DateTimeField(auto_now_add=True)
    total_sold = models.IntegerField(default=0)

    # Thêm trường để xác định sản phẩm có biến thể hay không
    has_variants = models.BooleanField(default=False, help_text="Sản phẩm có biến thể màu sắc/size")

    def __str__(self):
        return self.name

    def get_total_stock(self):
        """Tính tổng số lượng tồn kho từ tất cả biến thể"""
        if self.has_variants:
            return self.variants.aggregate(total=models.Sum('stock_quantity'))['total'] or 0
        return self.countInStock

    def get_min_price(self):
        """Lấy giá thấp nhất từ các biến thể"""
        if self.has_variants:
            min_price = self.variants.aggregate(min_price=models.Min('price'))['min_price']
            return min_price if min_price is not None else self.price
        return self.price


class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    color = models.ForeignKey(Color, on_delete=models.CASCADE)
    size = models.ForeignKey(Size, on_delete=models.CASCADE)
    price = models.DecimalField(max_digits=12, decimal_places=0, help_text="Giá cho biến thể này")
    stock_quantity = models.IntegerField(default=0, help_text="Số lượng tồn kho")
    sku = models.CharField(max_length=100, unique=True, blank=True, help_text="Mã SKU riêng cho biến thể")
    image = models.ImageField(null=True, blank=True, help_text="Hình ảnh riêng cho biến thể (tùy chọn)")

    def __str__(self):
        return f"{self.product.name} - {self.color.name} - {self.size.name}"

    def save(self, *args, **kwargs):
        # Tự động tạo SKU nếu chưa có
        if not self.sku:
            self.sku = f"{self.product.id}-{self.color.name}-{self.size.name}".upper().replace(' ', '-')
        super().save(*args, **kwargs)

    class Meta:
        unique_together = ('product', 'color', 'size')
        verbose_name = "Biến thể sản phẩm"
        verbose_name_plural = "Biến thể sản phẩm"


class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    name = models.CharField(max_length=200, null=True, blank=True)
    rating = models.IntegerField(null=True, blank=True, default=0, validators=[MaxValueValidator(5)])
    comment = models.TextField(null=True, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return str(self.rating)


class Coupon(models.Model):
    code = models.CharField(max_length=30, unique=True)
    description = models.TextField(blank=True, null=True)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=0, help_text="Số tiền giảm (VND)")
    min_order_amount = models.DecimalField(max_digits=12, decimal_places=0, help_text="Đơn tối thiểu để áp dụng (VND)")
    valid_from = models.DateTimeField()
    valid_to = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid(self):
        now = timezone.now()
        return self.is_active and self.valid_from <= now <= self.valid_to

    def __str__(self):
        return f"{self.code} - {self.discount_amount} VND"

class Order(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    taxPrice = models.DecimalField(max_digits=12, decimal_places=0)
    shippingPrice = models.DecimalField(max_digits=12, decimal_places=0)
    totalPrice = models.DecimalField(max_digits=12, decimal_places=0)
    paymentMethod = models.CharField(max_length=255, null=True, blank=True)
    isPaid = models.BooleanField(default=False)
    isDelivered = models.BooleanField(default=False)
    isRefunded = models.BooleanField(default=False)  # New field for refund tracking
    createdAt = models.DateTimeField(auto_now_add=True)
    paidAt = models.DateTimeField(auto_now_add=False, null=True, blank=True)
    deliveredAt = models.DateTimeField(
        auto_now_add=False, null=True, blank=True)
    coupon = models.ForeignKey(
        Coupon, null=True, blank=True, on_delete=models.SET_NULL)
    # deliveredAt = models.DateTimeField(auto_now_add=False, null=True, blank=True)

    def __str__(self) -> str:
        return f'{str(self.createdAt)} at {"Deleted User" if self.user == None else self.user.username}'

    class Meta:
        ordering = ('-createdAt',)


class OrderItem(models.Model):
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    product_variant = models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True, blank=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    productName = models.CharField(max_length=255, null=True, blank=True)
    qty = models.IntegerField(null=True, blank=True, default=1)
    price = models.DecimalField(max_digits=12, decimal_places=0)
    image = models.ImageField(null=True, blank=True, default='/placeholder.png')

    # Thêm thông tin biến thể để lưu trữ
    color_name = models.CharField(max_length=50, null=True, blank=True)
    size_name = models.CharField(max_length=10, null=True, blank=True)

    def __str__(self) -> str:
        variant_info = ""
        if self.color_name and self.size_name:
            variant_info = f" ({self.color_name} - {self.size_name})"
        return f'Order #{self.order.id} - {self.productName}{variant_info}'
    




class ShippingAddress(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, null=True, blank=False, related_name='shippingAddress')
    address = models.CharField(max_length=255, null=True, blank=True)
    city = models.CharField(max_length=255, null=True, blank=True)
    postalCode = models.CharField(max_length=255, null=True, blank=True)
    country = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self) -> str:
        return self.address


class PayboxWallet(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='paybox_wallet')
    balance = models.DecimalField(max_digits=12, decimal_places=0, default=0, help_text="Số dư ví tính bằng VND")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Paybox - {self.user.username}: {self.balance:,.0f} VND"

    def add_balance(self, amount):
        if amount > 0:
            self.balance += Decimal(str(amount))
            self.save()
            return True
        return False

    def deduct_balance(self, amount):
        if amount > 0 and self.balance >= Decimal(str(amount)):
            self.balance -= Decimal(str(amount))
            self.save()
            return True
        return False

    def has_sufficient_balance(self, amount):
        return self.balance >= Decimal(str(amount))

    class Meta:
        verbose_name = "Paybox Wallet"
        verbose_name_plural = "Paybox Wallets"


class PayboxTransaction(models.Model):
    TRANSACTION_TYPES = [
        ('DEPOSIT', 'Nạp tiền'),
        ('PAYMENT', 'Thanh toán đơn hàng'),
        ('REFUND', 'Hoàn tiền'),
        ('TRANSFER', 'Chuyển tiền'),
    ]

    TRANSACTION_STATUS = [
        ('PENDING', 'Đang xử lý'),
        ('COMPLETED', 'Hoàn thành'),
        ('FAILED', 'Thất bại'),
        ('CANCELLED', 'Đã hủy'),
    ]

    wallet = models.ForeignKey(PayboxWallet, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=0, help_text="Số tiền giao dịch tính bằng VND")
    status = models.CharField(max_length=20, choices=TRANSACTION_STATUS, default='PENDING')
    description = models.TextField(blank=True, null=True)
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='paybox_transactions')
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True, null=True)
    balance_before = models.DecimalField(max_digits=12, decimal_places=0, help_text="Số dư trước giao dịch")
    balance_after = models.DecimalField(max_digits=12, decimal_places=0, help_text="Số dư sau giao dịch")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.wallet.user.username} - {self.get_transaction_type_display()}: {self.amount:,.0f} VND"

    class Meta:
        verbose_name = "Paybox Transaction"
        verbose_name_plural = "Paybox Transactions"
        ordering = ['-created_at']


class RefundRequest(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='refund_request')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    reason = models.TextField()
    is_approved = models.BooleanField(null=True, default=None)
    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Refund for Order #{self.order.id} - {self.user.username}"

    class Meta:
        verbose_name = "Refund Request"
        verbose_name_plural = "Refund Requests"

class Favorite(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')
        
    def __str__(self):
        return f"{self.user.username} - {self.product.name}"
