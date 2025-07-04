from datetime import datetime
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os
from rest_framework import generics
from rest_framework.viewsets import ModelViewSet, GenericViewSet
from rest_framework.views import APIView
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, UpdateModelMixin
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from api import permissions
from api.models import Brand, Category, Order, OrderItem, Product, RefundRequest, Review, ShippingAddress, PayboxWallet, PayboxTransaction
from api.permissions import IsAdminUserOrReadOnly
from api.serializers import BrandSerializer, CategorySerializer, OrderSerializer, ProductSerializer, RefundRequestSerializer, ReviewSerializer, PayboxWalletSerializer, PayboxTransactionSerializer
from django.db import transaction
from django.shortcuts import get_object_or_404, redirect
from django.utils import timezone
import stripe

from api.models import RefundRequest



class BrandViewSet(ModelViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [IsAdminUserOrReadOnly]


class CategoryViewSet(ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUserOrReadOnly]


class ProductViewSet(ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminUserOrReadOnly]


class ReviewView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, pk):
        data = request.data
        user = request.user

        product = get_object_or_404(Product, id=pk)
        reviews = product.review_set.all()
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, pk):
        data = request.data
        user = request.user

        product = get_object_or_404(Product, id=pk)

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

    with transaction.atomic():
        order = Order.objects.create(user=user, paymentMethod=data['paymentMethod'], taxPrice=data['taxPrice'],
                                     shippingPrice=data['shippingPrice'], totalPrice=data['totalPrice'])

        shippingAddress = ShippingAddress.objects.create(order=order, address=data['shippingAddress']['address'], city=data['shippingAddress']
                                                         ['city'], postalCode=data['shippingAddress']['postalCode'], country=data['shippingAddress']['country'],)

        for x in orderItems:
            product = Product.objects.get(id=x['id'])

            item = OrderItem.objects.create(
                product=product,
                order=order,
                productName=product.name,
                qty=x['qty'],
                price=product.price,
                image=product.image.name
            )

            product.countInStock -= x['qty']
            product.save()

        serializer = OrderSerializer(order)
        return Response(serializer.data)


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


stripe.api_key = settings.STRIPE_API_KEY


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def updateOrderToPaid(request, pk):

    payment_intent = stripe.PaymentIntent.retrieve(
        request.data['payment_intent'])

    if payment_intent.status == "succeeded":
        order = get_object_or_404(Order, id=pk)
        order.isPaid = True
        order.paidAt = datetime.now()
        order.save()
        return Response('Payment was successful completed!')

    return Response('An unexpected error occurred! Please contact our customer care.')


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
        reason = request.data.get('reason', '')

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

        wallet = PayboxWallet.objects.get(user=order.user)
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


