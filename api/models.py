# from django.db import models
# from django.conf import settings
# from django.core.validators import MaxValueValidator
# from decimal import Decimal
# import logging;
# # Create your models here.


# class Category(models.Model):
#     title = models.CharField(max_length=255)
#     description = models.TextField(null=True, blank=False)
#     image = models.ImageField(null=True, blank=True,
#                               default='/placeholder.png')
#     featured_product = models.ForeignKey(
#         'Product', on_delete=models.SET_NULL, null=True, related_name='+', blank=True)

#     def __str__(self) -> str:
#         return self.title


# class Brand(models.Model):
#     title = models.CharField(max_length=255)
#     description = models.TextField(null=True, blank=True)
#     image = models.ImageField(null=True, blank=True,
#                               default='/placeholder.png')
#     featured_product = models.ForeignKey(
#         'Product', on_delete=models.SET_NULL, null=True, related_name='+', blank=True)

#     def __str__(self) -> str:
#         return self.title


# class Product(models.Model):
#     user = models.ForeignKey(settings.AUTH_USER_MODEL,
#                              on_delete=models.SET_NULL, null=True)
#     name = models.CharField(max_length=200, null=True, blank=True)
#     image = models.ImageField(null=True, blank=True,
#                               default='/placeholder.png')
#     brand = models.ForeignKey(Brand, on_delete=models.PROTECT)
#     category = models.ForeignKey(Category, on_delete=models.PROTECT)
#     description = models.TextField(null=True, blank=True)
#     rating = models.DecimalField(
#         max_digits=7, decimal_places=2, null=True, blank=True)
#     numReviews = models.IntegerField(null=True, blank=True, default=0)
#     price = models.DecimalField(
#         max_digits=12, decimal_places=0, null=True, blank=True)
#     countInStock = models.IntegerField(null=True, blank=True, default=0)
#     createdAt = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return self.name


# class Review(models.Model):
#     product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
#     user = models.ForeignKey(settings.AUTH_USER_MODEL,
#                              on_delete=models.SET_NULL, null=True)
#     name = models.CharField(max_length=200, null=True, blank=True)
#     rating = models.IntegerField(
#         null=True, blank=True, default=0, validators=[MaxValueValidator(5)])
#     comment = models.TextField(null=True, blank=True)
#     createdAt = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return str(self.rating)


# class Order(models.Model):
#     user = models.ForeignKey(settings.AUTH_USER_MODEL,
#                              on_delete=models.SET_NULL, null=True)
#     taxPrice = models.DecimalField(max_digits=12, decimal_places=0)
#     shippingPrice = models.DecimalField(max_digits=12, decimal_places=0)
#     totalPrice = models.DecimalField(max_digits=12, decimal_places=0)
#     paymentMethod = models.CharField(max_length=255, null=True, blank=True)
#     isPaid = models.BooleanField(default=False)
#     isDelivered = models.BooleanField(default=False)
#     createdAt = models.DateTimeField(auto_now_add=True)
#     paidAt = models.DateTimeField(auto_now_add=False, null=True, blank=True)
#     deliveredAt = models.DateTimeField(
#         auto_now_add=False, null=True, blank=True)

#     def __str__(self) -> str:
#         return f'{str(self.createdAt)} at {"Deleted User" if self.user == None else self.user.username}'
    
#     class Meta:
#         ordering = ('-createdAt',)


# class OrderItem(models.Model):
#     product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
#     order = models.ForeignKey(Order, on_delete=models.CASCADE)
#     productName = models.CharField(max_length=255, null=True, blank=True)
#     qty = models.IntegerField(null=True, blank=True, default=1)
#     price = models.DecimalField(max_digits=12, decimal_places=0)
#     image = models.ImageField(null=True, blank=True,
#                               default='/placeholder.png')

#     def __str__(self) -> str:
#         return f'Order #{self.order.id} - {self.productName}'


# class ShippingAddress(models.Model):
#     order = models.OneToOneField(
#         Order, on_delete=models.CASCADE, null=True, blank=False, related_name='shippingAddress')
#     address = models.CharField(max_length=255, null=True, blank=True)
#     city = models.CharField(max_length=255, null=True, blank=True)
#     postalCode = models.CharField(max_length=255, null=True, blank=True)
#     country = models.CharField(max_length=255, null=True, blank=True)

#     def __str__(self) -> str:
#         return self.address


# class PayboxWallet(models.Model):
#     """
#     Ví điện tử Paybox cho người dùng
#     """
#     user = models.OneToOneField(
#         settings.AUTH_USER_MODEL,
#         on_delete=models.CASCADE,
#         related_name='paybox_wallet'
#     )
#     balance = models.DecimalField(
#         max_digits=12,
#         decimal_places=0,
#         default=0,
#         help_text="Số dư ví tính bằng VND"
#     )
#     is_active = models.BooleanField(default=True)
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     def __str__(self):
#         return f"Paybox - {self.user.username}: {self.balance:,.0f} VND"

#     def add_balance(self, amount):
#         """Thêm tiền vào ví"""
#         if amount > 0:
#             self.balance += Decimal(str(amount))
#             self.save()
#             return True
#         return False

#     def deduct_balance(self, amount):
#         """Trừ tiền từ ví"""
#         if amount > 0 and self.balance >= Decimal(str(amount)):
#             self.balance -= Decimal(str(amount))
#             self.save()
#             return True
#         return False

#     def has_sufficient_balance(self, amount):
#         """Kiểm tra số dư có đủ không"""
#         return self.balance >= Decimal(str(amount))
    
    

#     class Meta:
#         verbose_name = "Paybox Wallet"
#         verbose_name_plural = "Paybox Wallets"


# class PayboxTransaction(models.Model):
#     """
#     Lịch sử giao dịch của ví Paybox
#     """
#     TRANSACTION_TYPES = [
#         ('DEPOSIT', 'Nạp tiền'),
#         ('PAYMENT', 'Thanh toán đơn hàng'),
#         ('REFUND', 'Hoàn tiền'),
#         ('TRANSFER', 'Chuyển tiền'),
#     ]

#     TRANSACTION_STATUS = [
#         ('PENDING', 'Đang xử lý'),
#         ('COMPLETED', 'Hoàn thành'),
#         ('FAILED', 'Thất bại'),
#         ('CANCELLED', 'Đã hủy'),
#     ]

#     wallet = models.ForeignKey(
#         PayboxWallet,
#         on_delete=models.CASCADE,
#         related_name='transactions'
#     )
#     transaction_type = models.CharField(
#         max_length=20,
#         choices=TRANSACTION_TYPES
#     )
#     amount = models.DecimalField(
#         max_digits=12,
#         decimal_places=0,
#         help_text="Số tiền giao dịch tính bằng VND"
#     )
#     status = models.CharField(
#         max_length=20,
#         choices=TRANSACTION_STATUS,
#         default='PENDING'
#     )
#     description = models.TextField(blank=True, null=True)

#     # Liên kết với đơn hàng nếu là thanh toán
#     order = models.ForeignKey(
#         Order,
#         on_delete=models.SET_NULL,
#         null=True,
#         blank=True,
#         related_name='paybox_transactions'
#     )

#     # Thông tin Stripe nếu là nạp tiền
#     stripe_payment_intent_id = models.CharField(
#         max_length=255,
#         blank=True,
#         null=True
#     )

#     # Số dư trước và sau giao dịch
#     balance_before = models.DecimalField(
#         max_digits=12,
#         decimal_places=0,
#         help_text="Số dư trước giao dịch"
#     )
#     balance_after = models.DecimalField(
#         max_digits=12,
#         decimal_places=0,
#         help_text="Số dư sau giao dịch"
#     )

#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     def __str__(self):
#         return f"{self.wallet.user.username} - {self.get_transaction_type_display()}: {self.amount:,.0f} VND"

#     class Meta:
#         verbose_name = "Paybox Transaction"
#         verbose_name_plural = "Paybox Transactions"
#         ordering = ['-created_at']
from django.db import models
from django.conf import settings
from django.core.validators import MaxValueValidator
from decimal import Decimal
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

    def __str__(self):
        return self.name


class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    name = models.CharField(max_length=200, null=True, blank=True)
    rating = models.IntegerField(null=True, blank=True, default=0, validators=[MaxValueValidator(5)])
    comment = models.TextField(null=True, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return str(self.rating)


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
    deliveredAt = models.DateTimeField(auto_now_add=False, null=True, blank=True)

    def __str__(self) -> str:
        return f'{str(self.createdAt)} at {"Deleted User" if self.user == None else self.user.username}'

    class Meta:
        ordering = ('-createdAt',)


class OrderItem(models.Model):
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    productName = models.CharField(max_length=255, null=True, blank=True)
    qty = models.IntegerField(null=True, blank=True, default=1)
    price = models.DecimalField(max_digits=12, decimal_places=0)
    image = models.ImageField(null=True, blank=True, default='/placeholder.png')

    def __str__(self) -> str:
        return f'Order #{self.order.id} - {self.productName}'


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
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Refund for Order #{self.order.id} - {self.user.username}"

    class Meta:
        verbose_name = "Refund Request"
        verbose_name_plural = "Refund Requests"
