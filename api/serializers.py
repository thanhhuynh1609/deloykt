from rest_framework import serializers
from api.models import Brand, Category, Product, Review, ShippingAddress, Order, OrderItem, PayboxWallet, PayboxTransaction, Favorite, Color, Size, ProductVariant
from django.contrib.auth.models import User
from django.utils import timezone
from .models import Coupon
from api.models import RefundRequest

from api.models import RefundRequest


class ReviewSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField(read_only=True)
    user_info = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Review
        fields = ('id', 'product', 'product_name', 'user', 'user_info', 'name', 'rating', 'comment', 'createdAt')

    def get_product_name(self, obj):
        return obj.product.name if obj.product else None

    def get_user_info(self, obj):
        if obj.user:
            return {
                'username': obj.user.username,
                'email': obj.user.email
            }
        return None


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'title', 'description', 'featured_product', 'image')


class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = ('id', 'name', 'hex_code')


class SizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Size
        fields = ('id', 'name', 'order')


class ProductVariantSerializer(serializers.ModelSerializer):
    color = ColorSerializer(read_only=True)
    size = SizeSerializer(read_only=True)
    color_id = serializers.IntegerField(write_only=True)
    size_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = ProductVariant
        fields = ('id', 'color', 'size', 'color_id', 'size_id', 'price', 'stock_quantity', 'sku', 'image')
        read_only_fields = ('sku',)


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ('id', 'title', 'description', 'featured_product', 'image')


class ProductSerializer(serializers.ModelSerializer):
    reviews = ReviewSerializer(read_only=True, many=True, source='review_set')
    is_favorite = serializers.SerializerMethodField()
    variants = ProductVariantSerializer(read_only=True, many=True)
    available_colors = serializers.SerializerMethodField()
    available_sizes = serializers.SerializerMethodField()
    min_price = serializers.SerializerMethodField()
    total_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ('id', 'name', 'image', 'brand', 'category', 'description',
                  'rating', 'numReviews', 'price', 'countInStock', 'createdAt',
                  'reviews', 'is_favorite', 'total_sold', 'has_variants', 'variants',
                  'available_colors', 'available_sizes', 'min_price', 'total_stock')

    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(user=request.user, product=obj).exists()
        return False

    def get_available_colors(self, obj):
        if obj.has_variants:
            colors = Color.objects.filter(productvariant__product=obj).distinct()
            return ColorSerializer(colors, many=True).data
        return []

    def get_available_sizes(self, obj):
        if obj.has_variants:
            sizes = Size.objects.filter(productvariant__product=obj).distinct().order_by('order', 'name')
            return SizeSerializer(sizes, many=True).data
        return []

    def get_min_price(self, obj):
        return obj.get_min_price()

    def get_total_stock(self, obj):
        return obj.get_total_stock()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')


class ShippingAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingAddress
        fields = '__all__'


class OrderItemSerializer(serializers.ModelSerializer):
    color_name = serializers.CharField(read_only=True)
    size_name = serializers.CharField(read_only=True)
    variant_info = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = '__all__'

    def get_variant_info(self, obj):
        if obj.color_name and obj.size_name:
            return f"{obj.color_name} - {obj.size_name}"
        elif obj.color_name:
            return obj.color_name
        elif obj.size_name:
            return obj.size_name
        return None


class OrderSerializer(serializers.ModelSerializer):
    orderItems = serializers.SerializerMethodField(read_only=True)
    shippingAddress = serializers.SerializerMethodField(read_only=True)
    user = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Order
        fields = '__all__'

    def get_orderItems(self, obj):
        items = obj.orderitem_set.all()
        serializer = OrderItemSerializer(items, many=True)
        return serializer.data

    def get_shippingAddress(self, obj):
        item = obj.shippingAddress
        serializer = ShippingAddressSerializer(item)
        return serializer.data

    def get_user(self, obj):
        user = obj.user
        serializer = UserSerializer(user)
        return serializer.data


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = '__all__'


class PayboxWalletSerializer(serializers.ModelSerializer):
    user_info = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PayboxWallet
        fields = ['id', 'user', 'user_info', 'balance', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']

    def get_user_info(self, obj):
        return {
            'username': obj.user.username,
            'email': obj.user.email
        }


class PayboxTransactionSerializer(serializers.ModelSerializer):
    wallet_info = serializers.SerializerMethodField(read_only=True)
    order_info = serializers.SerializerMethodField(read_only=True)
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = PayboxTransaction
        fields = [
            'id', 'wallet', 'wallet_info', 'transaction_type', 'transaction_type_display',
            'amount', 'status', 'status_display', 'description', 'order', 'order_info',
            'stripe_payment_intent_id', 'balance_before', 'balance_after',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['wallet', 'balance_before', 'balance_after', 'created_at', 'updated_at']

    def get_wallet_info(self, obj):
        return {
            'user_username': obj.wallet.user.username,
            'user_email': obj.wallet.user.email
        }

    def get_order_info(self, obj):
        if obj.order:
            return {
                'id': obj.order.id,
                'total_price': obj.order.totalPrice,
                'created_at': obj.order.createdAt
            }
        return None

    def update(self, instance, validated_data):
        # If isDelivered is being set to True and deliveredAt is not set
        if validated_data.get('isDelivered', False) and not instance.deliveredAt:
            validated_data['deliveredAt'] = timezone.now()

        return super().update(instance, validated_data)

class RefundRequestSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    order = serializers.PrimaryKeyRelatedField(read_only=True)
    order_info = serializers.SerializerMethodField()

    class Meta:
        model = RefundRequest
        fields = ['id', 'user', 'order', 'order_info', 'reason', 'is_approved', 'created_at', 'approved_at']
        read_only_fields = ['user', 'is_approved', 'created_at', 'approved_at']

    def get_order_info(self, obj):
        return {
            'id': obj.order.id,
            'totalPrice': obj.order.totalPrice,
            'isDelivered': obj.order.isDelivered,
            'isRefunded': obj.order.isRefunded,
        }
