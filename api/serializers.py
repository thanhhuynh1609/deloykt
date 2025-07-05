from rest_framework import serializers
from api.models import Brand, Category, Product, Review, ShippingAddress, Order, OrderItem, PayboxWallet, PayboxTransaction, Favorite
from django.contrib.auth.models import User
from django.utils import timezone


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


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ('id', 'title', 'description', 'featured_product', 'image')


class ProductSerializer(serializers.ModelSerializer):
    reviews = ReviewSerializer(read_only=True, many=True, source='review_set')
    is_favorite = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = ('id', 'name', 'image', 'brand', 'category', 'description',
                  'rating', 'numReviews', 'price', 'countInStock', 'createdAt', 
                  'reviews', 'is_favorite', 'total_sold')
    
    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(user=request.user, product=obj).exists()
        return False


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')


class ShippingAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingAddress
        fields = '__all__'


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = '__all__'


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
