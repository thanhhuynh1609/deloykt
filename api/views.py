from datetime import datetime
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from .models import Coupon
from rest_framework.decorators import action
from rest_framework.response import Response
from .serializers import CouponSerializer
import os
from rest_framework.viewsets import ModelViewSet, GenericViewSet
from rest_framework.views import APIView
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, UpdateModelMixin
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, viewsets, permissions
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from api.models import Brand, Category, Order, OrderItem, Product, Review, ShippingAddress, PayboxWallet, PayboxTransaction, RefundRequest, Favorite, Color, Size, ProductVariant
from api.permissions import IsAdminUserOrReadOnly
from api.serializers import BrandSerializer, CategorySerializer, OrderSerializer, ProductSerializer, ReviewSerializer, PayboxWalletSerializer, PayboxTransactionSerializer, ColorSerializer, SizeSerializer, ProductVariantSerializer
from django.db import transaction
from django.shortcuts import get_object_or_404, redirect
from django.utils import timezone
import stripe

# Conditional import for AI search
try:
    from .ai_search import ai_search_service
    AI_SEARCH_AVAILABLE = True
except ImportError:
    ai_search_service = None
    AI_SEARCH_AVAILABLE = False
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from .serializers import ProductSerializer
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

class BrandViewSet(ModelViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [IsAdminUserOrReadOnly]

    def update(self, request, *args, **kwargs):
        """Override update to handle file upload errors"""
        try:
            return super().update(request, *args, **kwargs)
        except Exception as e:
            return Response({
                'error': f'Brand update failed: {str(e)}',
                'error_type': type(e).__name__,
                'request_data': {
                    'has_files': bool(request.FILES),
                    'files': list(request.FILES.keys()) if request.FILES else [],
                    'data_keys': list(request.data.keys())
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'check_coupon']:
            return [permissions.AllowAny()]
        return super().get_permissions()

    @action(detail=False, methods=['post'], url_path='check')
    def check_coupon(self, request):
        code = request.data.get('code')
        total_price = request.data.get('total_price', 0)

        if not code:
            return Response({'error': 'Mã giảm giá không được cung cấp'}, status=400)

        try:
            coupon = Coupon.objects.get(code=code)
            if not coupon.is_valid():
                return Response({'error': 'Mã giảm giá không hợp lệ hoặc đã hết hạn'}, status=400)
            if total_price < coupon.min_order_amount:
                return Response({'error': f'Đơn hàng chưa đạt mức tối thiểu {coupon.min_order_amount} VND'}, status=400)
            return Response({
                'message': 'Mã giảm giá hợp lệ',
                'discount_amount': coupon.discount_amount,
                'coupon_id': coupon.id
            }, status=200)
        except Coupon.DoesNotExist:
            return Response({'error': 'Mã giảm giá không tồn tại'}, status=400)


class CategoryViewSet(ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUserOrReadOnly]

    def update(self, request, *args, **kwargs):
        """Override update to handle file upload errors"""
        try:
            return super().update(request, *args, **kwargs)
        except Exception as e:
            return Response({
                'error': f'Category update failed: {str(e)}',
                'error_type': type(e).__name__,
                'request_data': {
                    'has_files': bool(request.FILES),
                    'files': list(request.FILES.keys()) if request.FILES else [],
                    'data_keys': list(request.data.keys())
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ColorViewSet(ModelViewSet):
    queryset = Color.objects.all()
    serializer_class = ColorSerializer
    permission_classes = [IsAdminUserOrReadOnly]


class SizeViewSet(ModelViewSet):
    queryset = Size.objects.all()
    serializer_class = SizeSerializer
    permission_classes = [IsAdminUserOrReadOnly]


class ProductVariantViewSet(ModelViewSet):
    queryset = ProductVariant.objects.all()
    serializer_class = ProductVariantSerializer
    permission_classes = [IsAdminUserOrReadOnly]

    def get_queryset(self):
        queryset = ProductVariant.objects.all()
        product_id = self.request.query_params.get('product', None)
        if product_id is not None:
            queryset = queryset.filter(product=product_id)
        return queryset


class ProductViewSet(ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminUserOrReadOnly]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        return context

    def update(self, request, *args, **kwargs):
        """Override update to handle file upload errors"""
        try:
            return super().update(request, *args, **kwargs)
        except Exception as e:
            return Response({
                'error': f'Update failed: {str(e)}',
                'error_type': type(e).__name__,
                'request_data': {
                    'has_files': bool(request.FILES),
                    'files': list(request.FILES.keys()) if request.FILES else [],
                    'data_keys': list(request.data.keys())
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProductVariantDetailView(APIView):
    """API để lấy thông tin chi tiết biến thể sản phẩm"""
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, product_id, color_id, size_id):
        try:
            variant = ProductVariant.objects.get(
                product_id=product_id,
                color_id=color_id,
                size_id=size_id
            )
            serializer = ProductVariantSerializer(variant)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ProductVariant.DoesNotExist:
            return Response(
                {'error': 'Biến thể sản phẩm không tồn tại'},
                status=status.HTTP_404_NOT_FOUND
            )


class ReviewView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, pk):
        product = get_object_or_404(Product, id=pk)
        reviews = product.review_set.all()
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, pk):
        data = request.data
        user = request.user

        product = get_object_or_404(Product, id=pk)

        # Kiểm tra xem người dùng đã mua sản phẩm này chưa
        has_purchased = OrderItem.objects.filter(
            order__user=user,
            product=product,
            order__isPaid=True
        ).exists()

        if not has_purchased:
            return Response(
                {'detail': 'You can only review products you have purchased.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Kiểm tra xem người dùng đã đánh giá sản phẩm này chưa
        alreadyExists = product.review_set.filter(user=user).exists()

        if alreadyExists:
            return Response({'detail': 'Product Already Reviewed!'}, status=status.HTTP_400_BAD_REQUEST)

        if data['rating'] == 0:
            return Response({'detail': 'Please select a rating from 1 to 5!'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            review = Review.objects.create(
                product=product,
                user=user,
                name=user.username,
                rating=data['rating'],
                comment=data['comment'],
            )

            product.rating = (product.rating * product.numReviews +
                              data['rating'])/(product.numReviews + 1)
            product.numReviews += 1
            product.save()

            serializer = ReviewSerializer(review)

            return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def placeOrder(request):
    user = request.user
    data = request.data
    orderItems = data['orderItems']

    if not orderItems or len(orderItems) == 0:
        return Response({'detail': 'No Order items'}, status=status.HTTP_400_BAD_REQUEST)

    totalPrice = data['totalPrice']
    coupon_code = data.get('coupon_code')
    discount = 0
    coupon = None
    if coupon_code:
        try:
            coupon = Coupon.objects.get(code=coupon_code)
            if not coupon.is_valid():
                return Response({'error': 'Mã giảm giá không hợp lệ hoặc đã hết hạn'}, status=status.HTTP_400_BAD_REQUEST)
            if totalPrice < coupon.min_order_amount:
                return Response(
                    {'error': f'Đơn hàng chưa đạt mức tối thiểu {coupon.min_order_amount} VND'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            discount = coupon.discount_amount
        except Coupon.DoesNotExist:
            return Response({'error': 'Mã giảm giá không tồn tại'}, status=status.HTTP_400_BAD_REQUEST)

    totalPrice = max(0, totalPrice - discount)

    with transaction.atomic():
        order = Order.objects.create(
            user=user,
            paymentMethod=data['paymentMethod'],
            taxPrice=data['taxPrice'],
            shippingPrice=data['shippingPrice'],
            totalPrice=totalPrice,
            coupon=coupon
        )

        shippingAddress = ShippingAddress.objects.create(
            order=order,
            address=data['shippingAddress']['address'],
            city=data['shippingAddress']['city'],
            postalCode=data['shippingAddress']['postalCode'],
            country=data['shippingAddress']['country'],
        )

        for x in orderItems:
            product = Product.objects.get(id=x['id'])

            # Xử lý biến thể sản phẩm
            product_variant = None
            color_name = None
            size_name = None
            item_price = product.price

            if 'variant_id' in x and x['variant_id']:
                # Nếu có variant_id, sử dụng biến thể
                try:
                    product_variant = ProductVariant.objects.get(id=x['variant_id'])
                    color_name = product_variant.color.name
                    size_name = product_variant.size.name
                    item_price = product_variant.price

                    # Kiểm tra tồn kho biến thể
                    if product_variant.stock_quantity < x['qty']:
                        return Response(
                            {'error': f'Không đủ hàng cho {product.name} - {color_name} - {size_name}. Chỉ còn {product_variant.stock_quantity} sản phẩm.'},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    # Trừ tồn kho biến thể
                    product_variant.stock_quantity -= x['qty']
                    product_variant.save()

                except ProductVariant.DoesNotExist:
                    return Response(
                        {'error': 'Biến thể sản phẩm không tồn tại'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                # Sản phẩm không có biến thể, sử dụng tồn kho chính
                if product.countInStock < x['qty']:
                    return Response(
                        {'error': f'Không đủ hàng cho {product.name}. Chỉ còn {product.countInStock} sản phẩm.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                product.countInStock -= x['qty']
                product.save()

            # Tạo OrderItem
            item = OrderItem.objects.create(
                product=product,
                product_variant=product_variant,
                order=order,
                productName=product.name,
                qty=x['qty'],
                price=item_price,
                image=product.image.name,
                color_name=color_name,
                size_name=size_name
            )

        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class OrderViewSet(GenericViewSet, ListModelMixin, RetrieveModelMixin, UpdateModelMixin):
    def get_queryset(self):
        if (self.request.user.is_staff):
            return Order.objects.all()
        return Order.objects.filter(user=self.request.user)
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]


class ReviewViewSet(ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAdminUserOrReadOnly]


stripe.api_key = settings.STRIPE_SECRET_KEY


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_order_to_paid(request, pk):
    try:
        # Lấy PaymentIntent từ Stripe
        payment_intent = stripe.PaymentIntent.retrieve(request.data.get('payment_intent'))

        if payment_intent.status == "succeeded":
            order = get_object_or_404(Order, id=pk)

            # Kiểm tra xem đơn hàng có phải của user hoặc admin không
            if order.user != request.user and not request.user.is_staff:
                return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

            # Cập nhật trạng thái đơn hàng
            order.isPaid = True
            order.paidAt = datetime.now()
            order.save()

            # Cập nhật số lượng total_sold cho từng sản phẩm
            with transaction.atomic():
                for item in order.orderitem_set.all():
                    product = item.product
                    product.total_sold += item.qty
                    product.save()

            return Response({'detail': 'Thanh toán thành công, đơn hàng của bạn đã được cập nhật!'}, status=status.HTTP_200_OK)

        else:
            return Response({'detail': 'Payment not successful yet.'}, status=status.HTTP_400_BAD_REQUEST)

    except stripe.error.StripeError as e:
        return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StripePaymentView(APIView):
    def post(self, request):
        try:
            # print(request.data)
            order = get_object_or_404(Order, id=request.data['order'])
            intent = stripe.PaymentIntent.create(
                amount=int(order.totalPrice),  # VND doesn't use cents like USD/EUR
                currency='vnd',
                automatic_payment_methods={
                    'enabled': True,
                }
            )

            return Response({'clientSecret': intent['client_secret']})
        except Exception as e:
            print(e)
            return Response({'error': 'Something went wrong while creating stripe checkout session!'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Thêm endpoint để cập nhật review
@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def update_review(request, pk, review_id):
    user = request.user
    product = get_object_or_404(Product, id=pk)
    
    try:
        review = Review.objects.get(id=review_id, product=product)
    except Review.DoesNotExist:
        return Response({'detail': 'Review not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Chỉ admin hoặc người tạo review mới có thể cập nhật/xóa
    if not user.is_staff and review.user != user:
        return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'DELETE':
        with transaction.atomic():
            # Cập nhật lại rating của sản phẩm
            if product.numReviews > 1:
                product.rating = (product.rating * product.numReviews - review.rating) / (product.numReviews - 1)
            else:
                product.rating = 0
            product.numReviews -= 1
            product.save()
            
            review.delete()
        return Response({'detail': 'Review deleted'}, status=status.HTTP_204_NO_CONTENT)
    
    # PUT request - cập nhật review
    data = request.data
    
    with transaction.atomic():
        # Cập nhật lại rating của sản phẩm
        product.rating = (product.rating * product.numReviews - review.rating + data['rating']) / product.numReviews
        product.save()
        
        review.rating = data['rating']
        review.comment = data['comment']
        review.save()
        
        serializer = ReviewSerializer(review)
        return Response(serializer.data)


class ImageUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            if 'image' not in request.FILES:
                return Response({'error': 'No image file provided'}, status=status.HTTP_400_BAD_REQUEST)

            image_file = request.FILES['image']

            # Validate file type
            allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
            if image_file.content_type not in allowed_types:
                return Response({'error': 'Invalid file type. Only JPEG, PNG, and GIF are allowed.'},
                              status=status.HTTP_400_BAD_REQUEST)

            # Validate file size (max 5MB)
            if image_file.size > 5 * 1024 * 1024:
                return Response({'error': 'File too large. Maximum size is 5MB.'},
                              status=status.HTTP_400_BAD_REQUEST)

            # Generate unique filename
            import uuid
            file_extension = os.path.splitext(image_file.name)[1]
            unique_filename = f"products/{uuid.uuid4()}{file_extension}"

            # Save file
            file_path = default_storage.save(unique_filename, ContentFile(image_file.read()))

            # Return the file URL
            file_url = default_storage.url(file_path)

            return Response({
                'image_url': file_url,
                'message': 'Image uploaded successfully'
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================== PAYBOX WALLET VIEWS ====================

class PayboxWalletView(APIView):
    """
    API để quản lý ví Paybox của người dùng
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Lấy thông tin ví của người dùng hiện tại"""
        try:
            print(f"PayboxWalletView: User = {request.user}")
            print(f"PayboxWalletView: User authenticated = {request.user.is_authenticated}")

            wallet, created = PayboxWallet.objects.get_or_create(user=request.user)
            print(f"PayboxWalletView: Wallet = {wallet}, Created = {created}")

            serializer = PayboxWalletSerializer(wallet)
            print(f"PayboxWalletView: Serialized data = {serializer.data}")

            return Response(serializer.data)
        except Exception as e:
            print(f"PayboxWalletView: Error = {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PayboxTransactionListView(APIView):
    """
    API để xem lịch sử giao dịch của ví
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Lấy danh sách giao dịch của người dùng hiện tại"""
        try:
            print(f"PayboxTransactionListView: User = {request.user}")

            wallet, created = PayboxWallet.objects.get_or_create(user=request.user)
            print(f"PayboxTransactionListView: Wallet = {wallet}")

            transactions = PayboxTransaction.objects.filter(wallet=wallet)
            print(f"PayboxTransactionListView: Found {transactions.count()} transactions")

            serializer = PayboxTransactionSerializer(transactions, many=True)
            print(f"PayboxTransactionListView: Serialized {len(serializer.data)} transactions")

            return Response(serializer.data)
        except Exception as e:
            print(f"PayboxTransactionListView: Error = {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PayboxDepositView(APIView):
    """
    API để nạp tiền vào ví Paybox qua Stripe
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Tạo payment intent để nạp tiền vào ví"""
        try:
            print(f"PayboxDepositView: User = {request.user}")
            print(f"PayboxDepositView: Request data = {request.data}")

            amount = request.data.get('amount')
            print(f"PayboxDepositView: Amount = {amount}")

            if not amount or amount <= 0:
                return Response({'error': 'Số tiền nạp phải lớn hơn 0'}, status=status.HTTP_400_BAD_REQUEST)

            # Tạo Stripe payment intent
            print(f"PayboxDepositView: Creating Stripe payment intent for amount {amount}")
            intent = stripe.PaymentIntent.create(
                amount=int(amount),  # VND không dùng cents
                currency='vnd',
                metadata={
                    'user_id': request.user.id,
                    'transaction_type': 'DEPOSIT'
                },
                automatic_payment_methods={
                    'enabled': True,
                }
            )

            print(f"PayboxDepositView: Stripe intent created = {intent['id']}")

            response_data = {
                'clientSecret': intent['client_secret'],
                'paymentIntentId': intent['id']
            }
            print(f"PayboxDepositView: Returning response = {response_data}")

            return Response(response_data)
        except Exception as e:
            print(f"PayboxDepositView: Error = {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PayboxDepositConfirmView(APIView):
    """
    API để xác nhận nạp tiền thành công
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Xác nhận và cập nhật số dư ví sau khi thanh toán Stripe thành công"""
        try:
            payment_intent_id = request.data.get('payment_intent_id')
            if not payment_intent_id:
                return Response({'error': 'Payment intent ID is required'}, status=status.HTTP_400_BAD_REQUEST)

            # Lấy thông tin payment intent từ Stripe
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)

            if intent['status'] != 'succeeded':
                return Response({'error': 'Payment not completed'}, status=status.HTTP_400_BAD_REQUEST)

            amount = intent['amount']

            with transaction.atomic():
                # Lấy hoặc tạo ví
                wallet, created = PayboxWallet.objects.get_or_create(user=request.user)

                # Kiểm tra xem giao dịch đã được xử lý chưa
                existing_transaction = PayboxTransaction.objects.filter(
                    stripe_payment_intent_id=payment_intent_id
                ).first()

                if existing_transaction:
                    return Response({'error': 'Transaction already processed'}, status=status.HTTP_400_BAD_REQUEST)

                # Lưu số dư trước giao dịch
                balance_before = wallet.balance

                # Cập nhật số dư ví
                wallet.add_balance(amount)

                # Tạo giao dịch
                PayboxTransaction.objects.create(
                    wallet=wallet,
                    transaction_type='DEPOSIT',
                    amount=amount,
                    status='COMPLETED',
                    description=f'Nạp tiền qua Stripe - {payment_intent_id}',
                    stripe_payment_intent_id=payment_intent_id,
                    balance_before=balance_before,
                    balance_after=wallet.balance
                )

            return Response({
                'message': 'Nạp tiền thành công',
                'new_balance': wallet.balance
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PayboxPaymentView(APIView):
    """
    API để thanh toán đơn hàng bằng ví Paybox
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Thanh toán đơn hàng bằng số dư ví Paybox"""
        try:
            order_id = request.data.get('order_id')
            if not order_id:
                return Response({'error': 'Order ID is required'}, status=status.HTTP_400_BAD_REQUEST)

            # Lấy đơn hàng
            order = get_object_or_404(Order, id=order_id, user=request.user)

            if order.isPaid:
                return Response({'error': 'Đơn hàng đã được thanh toán'}, status=status.HTTP_400_BAD_REQUEST)

            # Lấy ví của người dùng
            wallet, created = PayboxWallet.objects.get_or_create(user=request.user)

            # Kiểm tra số dư
            if not wallet.has_sufficient_balance(float(order.totalPrice)):
                return Response({
                    'error': 'Số dư không đủ để thanh toán đơn hàng',
                    'required': float(order.totalPrice),
                    'available': float(wallet.balance)
                }, status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                # Lưu số dư trước giao dịch
                balance_before = wallet.balance

                # Trừ tiền từ ví
                if wallet.deduct_balance(order.totalPrice):
                    # Cập nhật trạng thái đơn hàng
                    order.isPaid = True
                    order.paidAt = timezone.now()
                    order.paymentMethod = 'Paybox'
                    order.save()

                    # Tạo giao dịch
                    PayboxTransaction.objects.create(
                        wallet=wallet,
                        transaction_type='PAYMENT',
                        amount=order.totalPrice,
                        status='COMPLETED',
                        description=f'Thanh toán đơn hàng #{order.id}',
                        order=order,
                        balance_before=balance_before,
                        balance_after=wallet.balance
                    )

                    return Response({
                        'message': 'Thanh toán thành công',
                        'order_id': order.id,
                        'amount_paid': float(order.totalPrice),
                        'remaining_balance': float(wallet.balance)
                    })
                else:
                    return Response({'error': 'Không thể thực hiện thanh toán'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================== ADMIN PAYBOX VIEWS ====================

class AdminPayboxWalletListView(APIView):
    """
    API cho admin để xem danh sách tất cả ví Paybox
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Lấy danh sách tất cả ví (chỉ admin)"""
        if not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        try:
            wallets = PayboxWallet.objects.all().order_by('-created_at')
            serializer = PayboxWalletSerializer(wallets, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminPayboxTransactionListView(APIView):
    """
    API cho admin để xem danh sách tất cả giao dịch Paybox
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Lấy danh sách tất cả giao dịch (chỉ admin)"""
        if not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        try:
            transactions = PayboxTransaction.objects.all().order_by('-created_at')
            serializer = PayboxTransactionSerializer(transactions, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        


class AdminRefundRequestListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=403)

        refunds = RefundRequest.objects.select_related('order', 'user').order_by('-created_at')
        data = [{
            'id': refund.id,
            'user': {
                'id': refund.user.id,
                'username': refund.user.username
            },
            'order': {
                'id': refund.order.id
            },
            'reason': refund.reason,
            'isApproved': refund.is_approved,
            'createdAt': refund.created_at,
        } for refund in refunds]

        return Response(data)

class RefundRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_id = request.data.get('order_id')
        reason = request.data.get('reason', '').strip()

        order = get_object_or_404(Order, id=order_id, user=request.user)

        if not order.isPaid:
            return Response({'error': 'Đơn hàng chưa được thanh toán'}, status=400)

        if order.isRefunded:
            return Response({'error': 'Đơn hàng đã được hoàn tiền'}, status=400)

        if hasattr(order, 'refund_request'):
            return Response({'error': 'Yêu cầu hoàn tiền đã tồn tại'}, status=400)

        RefundRequest.objects.create(
            order=order,
            user=request.user,
            reason=reason
        )

        return Response({'message': 'Yêu cầu hoàn tiền đã được gửi'}, status=201)
class ApproveRefundRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        if not request.user.is_staff:
            return Response({'error': 'Không có quyền'}, status=403)

        order = get_object_or_404(Order, id=order_id)
        refund = getattr(order, 'refund_request', None)

        if not refund:
            return Response({'error': 'Không có yêu cầu hoàn tiền'}, status=400)
        if refund.is_approved:
            return Response({'error': 'Yêu cầu đã được duyệt'}, status=400)

        wallet, _ = PayboxWallet.objects.get_or_create(user=order.user)
        balance_before = wallet.balance

        with transaction.atomic():
            wallet.add_balance(order.totalPrice)

            order.isRefunded = True
            order.save()

            refund.is_approved = True
            refund.approved_at = timezone.now()
            refund.save()

            PayboxTransaction.objects.create(
                wallet=wallet,
                transaction_type='REFUND',
                amount=order.totalPrice,
                status='COMPLETED',
                description=f'Hoàn tiền cho đơn hàng #{order.id}',
                order=order,
                balance_before=balance_before,
                balance_after=wallet.balance
            )

        return Response({'message': 'Đã hoàn tiền thành công'}, status=200)
class RejectRefundRequestView(APIView):
    permission_classes = [IsAuthenticated]


    def delete(self, request, order_id):
        if not request.user.is_staff:
            return Response({'error': 'Không có quyền'}, status=403)

        order = get_object_or_404(Order, id=order_id)
        refund = getattr(order, 'refund_request', None)

        if not refund:
            return Response({'error': 'Không có yêu cầu hoàn tiền'}, status=400)
        if refund.is_approved is not None:
            return Response({'error': 'Yêu cầu đã được xử lý'}, status=400)

        refund.is_approved = False
        refund.approved_at = timezone.now()
        refund.save()

        return Response({'message': 'Yêu cầu hoàn tiền đã bị từ chối'}, status=200)
class DeleteRefundRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, order_id):
        if not request.user.is_staff:
            return Response({'error': 'Không có quyền'}, status=403)

        order = get_object_or_404(Order, id=order_id)
        refund = getattr(order, 'refund_request', None)

        if not refund:
            return Response({'error': 'Không có yêu cầu hoàn tiền'}, status=400)

        refund.delete()

        return Response({'message': 'Yêu cầu hoàn tiền đã bị xóa'}, status=200)


    def delete(self, request, order_id):
        if not request.user.is_staff:
            return Response({'error': 'Không có quyền'}, status=403)


        order = get_object_or_404(Order, id=order_id)
        refund = getattr(order, 'refund_request', None)

        if not refund:
            return Response({'error': 'Không có yêu cầu hoàn tiền'}, status=400)
        if refund.is_approved is not None:
            return Response({'error': 'Yêu cầu đã được xử lý'}, status=400)

        refund.is_approved = False
        refund.approved_at = timezone.now()
        refund.save()

        return Response({'message': 'Yêu cầu hoàn tiền đã bị từ chối'}, status=200)
class DeleteRefundRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, order_id):
        if not request.user.is_staff:
            return Response({'error': 'Không có quyền'}, status=403)

        order = get_object_or_404(Order, id=order_id)
        refund = getattr(order, 'refund_request', None)

        if not refund:
            return Response({'error': 'Không có yêu cầu hoàn tiền'}, status=400)

        refund.delete()

        return Response({'message': 'Yêu cầu hoàn tiền đã bị xóa'}, status=200)

class FavoriteView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Lấy danh sách sản phẩm yêu thích của người dùng"""
        favorites = Favorite.objects.filter(user=request.user)
        products = [favorite.product for favorite in favorites]
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        """Thêm sản phẩm vào danh sách yêu thích"""
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'detail': 'Product ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        product = get_object_or_404(Product, id=product_id)
        
        # Kiểm tra xem đã tồn tại trong danh sách yêu thích chưa
        favorite, created = Favorite.objects.get_or_create(user=request.user, product=product)
        
        if created:
            return Response({'detail': 'Product added to favorites'}, status=status.HTTP_201_CREATED)
        return Response({'detail': 'Product already in favorites'}, status=status.HTTP_200_OK)
    
    def delete(self, request):
        """Xóa sản phẩm khỏi danh sách yêu thích"""
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'detail': 'Product ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            favorite = Favorite.objects.get(user=request.user, product_id=product_id)
            favorite.delete()
            return Response({'detail': 'Product removed from favorites'}, status=status.HTTP_204_NO_CONTENT)
        except Favorite.DoesNotExist:
            return Response({'detail': 'Product not in favorites'}, status=status.HTTP_404_NOT_FOUND)


# Thêm endpoint để kiểm tra sản phẩm có trong danh sách yêu thích không
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_favorite(request, pk):
    """Kiểm tra xem sản phẩm có trong danh sách yêu thích không"""
    is_favorite = Favorite.objects.filter(user=request.user, product_id=pk).exists()
    return Response({'is_favorite': is_favorite})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_purchase(request, pk):
    """Kiểm tra xem người dùng đã mua sản phẩm này chưa"""
    user = request.user
    product = get_object_or_404(Product, id=pk)
    
    has_purchased = OrderItem.objects.filter(
        order__user=user,
        product=product,
        order__isPaid=True
    ).exists()
    
    return Response({'has_purchased': has_purchased})

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def ai_search_by_image(request):
    """AI search by image"""
    if not AI_SEARCH_AVAILABLE:
        return Response({'error': 'AI search not available'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        if 'image' not in request.FILES:
            return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        image = request.FILES['image']
        limit = int(request.data.get('limit', 5))
        
        results = ai_search_service.search_by_image(image, limit=limit)
        
        response_data = []
        for result in results:
            product_data = ProductSerializer(result['product']).data
            product_data['compatibility_percent'] = result['compatibility_percent']
            response_data.append(product_data)
        
        return Response({
            'products': response_data,
            'count': len(response_data)
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def ai_search_by_text(request):
    """AI search by text description"""
    if not AI_SEARCH_AVAILABLE:
        return Response({'error': 'AI search not available'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        text = request.data.get('text', '').strip()
        if not text:
            return Response({'error': 'No text provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        limit = int(request.data.get('limit', 5))
        
        results = ai_search_service.search_by_text(text, limit=limit)
        
        response_data = []
        for result in results:
            product_data = ProductSerializer(result['product']).data
            product_data['compatibility_percent'] = result['compatibility_percent']
            response_data.append(product_data)
        
        return Response({
            'products': response_data,
            'count': len(response_data)
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def ai_search_combined(request):
    """Combined AI search with both image and text"""
    if not AI_SEARCH_AVAILABLE:
        return Response({'error': 'AI search not available'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        image = request.FILES.get('image')
        text = request.data.get('text', '').strip()
        limit = int(request.data.get('limit', 5))
        
        if not image and not text:
            return Response({'error': 'Provide either image or text'}, status=status.HTTP_400_BAD_REQUEST)
        
        image_results = []
        text_results = []
        
        if image:
            image_results = ai_search_service.search_by_image(image, limit=limit*2)
        
        if text:
            text_results = ai_search_service.search_by_text(text, limit=limit*2)
        
        # Combine results with weighted scores
        combined_results = {}
        
        # Add image results
        for result in image_results:
            product_id = result['product'].id
            combined_results[product_id] = {
                'product': result['product'],
                'image_score': result['similarity'],
                'text_score': 0,
                'combined_score': result['similarity'] * 0.6  # Weight image 60%
            }
        
        # Add text results
        for result in text_results:
            product_id = result['product'].id
            if product_id in combined_results:
                combined_results[product_id]['text_score'] = result['similarity']
                combined_results[product_id]['combined_score'] = (
                    combined_results[product_id]['image_score'] * 0.6 + 
                    result['similarity'] * 0.4
                )
            else:
                combined_results[product_id] = {
                    'product': result['product'],
                    'image_score': 0,
                    'text_score': result['similarity'],
                    'combined_score': result['similarity'] * 0.4  # Weight text 40%
                }
        
        # Sort by combined score
        sorted_results = sorted(
            combined_results.values(), 
            key=lambda x: x['combined_score'], 
            reverse=True
        )[:limit]
        
        response_data = []
        for result in sorted_results:
            product_data = ProductSerializer(result['product']).data
            compatibility_percent = min(100, max(0, int(result['combined_score'] * 100)))
            
            # Debug log
            print(f"Product {result['product'].name}: score={result['combined_score']}, percent={compatibility_percent}")
            
            product_data['compatibility_percent'] = compatibility_percent
            response_data.append(product_data)
        
        return Response({
            'products': response_data,
            'count': len(response_data)
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@csrf_exempt
@require_http_methods(["GET"])
def health_check(request):
    """
    Health check endpoint for Render deployment
    """
    try:
        # Test database connection
        from django.db import connection
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        db_status = "OK"
    except Exception as e:
        db_status = f"ERROR: {str(e)}"

    try:
        # Test Redis connection
        import redis
        import os
        redis_url = os.getenv('REDIS_URL')
        if redis_url:
            r = redis.from_url(redis_url)
            r.ping()
            redis_status = "OK"
        else:
            redis_status = "No REDIS_URL"
    except Exception as e:
        redis_status = f"ERROR: {str(e)}"

    # Check database tables
    try:
        from django.contrib.auth.models import User
        from api.models import Product, Category
        user_count = User.objects.count()
        product_count = Product.objects.count()
        category_count = Category.objects.count()
        tables_info = f"Users: {user_count}, Products: {product_count}, Categories: {category_count}"
    except Exception as e:
        tables_info = f"Tables ERROR: {str(e)}"

    return JsonResponse({
        'status': 'healthy',
        'message': 'E-commerce API is running',
        'database': db_status,
        'redis': redis_status,
        'django_settings': os.getenv('DJANGO_SETTINGS_MODULE', 'Not set'),
        'tables': tables_info
    })


@csrf_exempt
@require_http_methods(["GET"])
def debug_users(request):
    """
    Debug endpoint to check user admin status
    """
    try:
        from django.contrib.auth.models import User

        users_info = []
        for user in User.objects.all():
            users_info.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'is_staff_type': type(user.is_staff).__name__,
                'is_superuser_type': type(user.is_superuser).__name__,
                'isAdmin_calculated': bool(user.is_staff or user.is_superuser)
            })

        return JsonResponse({
            'status': 'success',
            'users': users_info,
            'total_users': len(users_info)
        })

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["GET", "POST"])
def setup_production(request):
    """
    Manual production setup endpoint (for free tier without shell)
    """
    try:
        from django.core.management import call_command
        from io import StringIO

        # Capture command output
        out = StringIO()

        # Run migrations first
        out.write("🗄️ Running migrations...\n")
        call_command('makemigrations', stdout=out, verbosity=2)
        call_command('migrate', stdout=out, verbosity=2)

        # Then run setup
        out.write("🎯 Running production setup...\n")
        call_command('setup_production', stdout=out)

        output = out.getvalue()

        return JsonResponse({
            'status': 'success',
            'message': 'Production setup completed',
            'output': output
        })

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Setup failed: {str(e)}',
            'traceback': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["GET", "POST"])
def create_superuser(request):
    """
    Create superuser endpoint for free tier
    GET: Show form, POST: Create user
    """
    if request.method == "GET":
        # Return simple HTML form
        html = """
        <!DOCTYPE html>
        <html>
        <head><title>Create Superuser</title></head>
        <body>
            <h2>Create Superuser</h2>
            <form method="POST">
                <p>Username: <input type="text" name="username" required></p>
                <p>Email: <input type="email" name="email" required></p>
                <p>Password: <input type="password" name="password" required></p>
                <p><button type="submit">Create Superuser</button></p>
            </form>
        </body>
        </html>
        """
        return HttpResponse(html)

    try:
        from django.contrib.auth.models import User

        username = request.POST.get('username') or request.GET.get('username')
        email = request.POST.get('email') or request.GET.get('email')
        password = request.POST.get('password') or request.GET.get('password')

        if not all([username, email, password]):
            return JsonResponse({
                'status': 'error',
                'message': 'Username, email, and password are required'
            }, status=400)

        # Check if user already exists
        if User.objects.filter(username=username).exists():
            return JsonResponse({
                'status': 'error',
                'message': f'User {username} already exists'
            }, status=400)

        # Create superuser
        user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password
        )

        return JsonResponse({
            'status': 'success',
            'message': f'Superuser {username} created successfully',
            'user_id': user.id,
            'admin_url': '/admin/'
        })

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Failed to create superuser: {str(e)}'
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def debug_env(request):
    """
    Debug endpoint to check environment variables
    """
    import os
    from django.conf import settings

    env_vars = {
        'STRIPE_PUBLISHABLE_KEY': 'Set' if os.getenv('STRIPE_PUBLISHABLE_KEY') else 'Missing',
        'STRIPE_SECRET_KEY': 'Set' if os.getenv('STRIPE_SECRET_KEY') else 'Missing',
        'CLOUDINARY_CLOUD_NAME': os.getenv('CLOUDINARY_CLOUD_NAME', 'Missing'),  # Show actual value
        'CLOUDINARY_API_KEY': 'Set' if os.getenv('CLOUDINARY_API_KEY') else 'Missing',
        'CLOUDINARY_API_SECRET': 'Set' if os.getenv('CLOUDINARY_API_SECRET') else 'Missing',
        'DATABASE_URL': 'Set' if os.getenv('DATABASE_URL') else 'Missing',
        'REDIS_URL': 'Set' if os.getenv('REDIS_URL') else 'Missing',
    }

    # Check Django settings
    django_settings = {
        'STRIPE_SECRET_KEY': 'Set' if hasattr(settings, 'STRIPE_SECRET_KEY') and settings.STRIPE_SECRET_KEY else 'Missing',
        'DEFAULT_FILE_STORAGE': getattr(settings, 'DEFAULT_FILE_STORAGE', 'Not set'),
        'MEDIA_URL': getattr(settings, 'MEDIA_URL', 'Not set'),
    }

    # Check Cloudinary config
    cloudinary_config = {}
    try:
        import cloudinary
        cloudinary_config = {
            'cloud_name': cloudinary.config().cloud_name,
            'api_key': 'Set' if cloudinary.config().api_key else 'Missing',
            'api_secret': 'Set' if cloudinary.config().api_secret else 'Missing',
        }
    except Exception as e:
        cloudinary_config = {'error': str(e)}

    return JsonResponse({
        'environment_variables': env_vars,
        'django_settings': django_settings,
        'stripe_api_key_in_stripe_module': 'Set' if stripe.api_key else 'Missing',
        'cloudinary_config': cloudinary_config
    })


@csrf_exempt
@require_http_methods(["POST"])
def test_upload(request):
    """
    Test file upload endpoint
    """
    try:
        if 'file' not in request.FILES:
            return JsonResponse({
                'status': 'error',
                'message': 'No file provided'
            }, status=400)

        uploaded_file = request.FILES['file']

        # Try to save file
        from django.core.files.storage import default_storage
        file_name = default_storage.save(f'test/{uploaded_file.name}', uploaded_file)
        file_url = default_storage.url(file_name)

        return JsonResponse({
            'status': 'success',
            'message': 'File uploaded successfully',
            'file_name': file_name,
            'file_url': file_url,
            'storage_backend': str(type(default_storage).__name__)
        })

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Upload failed: {str(e)}',
            'error_type': type(e).__name__
        }, status=500)

