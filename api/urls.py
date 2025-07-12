from os import path
from django.urls import path
from rest_framework.routers import DefaultRouter
from api.views import (
    BrandViewSet, CategoryViewSet, CouponViewSet, OrderViewSet, ProductViewSet,
    ColorViewSet, SizeViewSet, ProductVariantViewSet, ProductVariantDetailView,
    ReviewView, ReviewViewSet, StripePaymentView,
    placeOrder, update_order_to_paid, update_review,
    PayboxWalletView, PayboxTransactionListView, PayboxDepositView,
    PayboxDepositConfirmView, PayboxPaymentView,
    AdminPayboxWalletListView, AdminPayboxTransactionListView,
    RejectRefundRequestView, DeleteRefundRequestView, RefundRequestView,
    AdminRefundRequestListView, ApproveRefundRequestView,
    FavoriteView, check_favorite, check_purchase
)
from chat.views import chat_history


router = DefaultRouter()
router.register('brands', BrandViewSet, basename='brands')
router.register('category', CategoryViewSet, basename='category')
router.register('products', ProductViewSet, basename='products')
router.register('colors', ColorViewSet, basename='colors')
router.register('sizes', SizeViewSet, basename='sizes')
router.register('product-variants', ProductVariantViewSet, basename='product-variants')
router.register('orders', OrderViewSet, basename='orders')
router.register('reviews', ReviewViewSet, basename='reviews')
router.register(r'coupons', CouponViewSet, basename='coupon')

urlpatterns = [*router.urls,
    path('placeorder/', placeOrder, name='create-order'),
    path('orders/<str:pk>/pay/', update_order_to_paid, name="pay"),
    path('stripe-payment/', StripePaymentView.as_view(),
        name='stipe-payment'),
    path('products/<str:pk>/reviews/', ReviewView.as_view(), name='product-reviews'),
    path('products/<str:pk>/reviews/<str:review_id>/', update_review, name='update-review'),
    path('products/<int:product_id>/variants/<int:color_id>/<int:size_id>/',
         ProductVariantDetailView.as_view(), name='product-variant-detail'),

    # Paybox endpoints
    path('paybox/wallet/', PayboxWalletView.as_view(), name='paybox-wallet'),
    path('paybox/transactions/', PayboxTransactionListView.as_view(), name='paybox-transactions'),
    path('paybox/deposit/', PayboxDepositView.as_view(), name='paybox-deposit'),
    path('paybox/deposit/confirm/', PayboxDepositConfirmView.as_view(), name='paybox-deposit-confirm'),
    path('paybox/payment/', PayboxPaymentView.as_view(), name='paybox-payment'),


    path('paybox/refund-requests/', AdminRefundRequestListView.as_view(), name='admin-paybox-refund-requests'),
    path('paybox/refund-request/', RefundRequestView.as_view(), name='refund-request'),

    # Admin Refund APIs
    path('admin/paybox/refund/<int:order_id>/approve/', ApproveRefundRequestView.as_view(), name='admin-approve-refund'),
    path('admin/paybox/refund/<int:order_id>/reject/', RejectRefundRequestView.as_view(), name='admin-reject-refund'),
    path('admin/paybox/refund/<int:order_id>/delete/', DeleteRefundRequestView.as_view(), name='admin-delete-refund'),


    # Admin Paybox endpoints
    path('admin/paybox/wallets/', AdminPayboxWalletListView.as_view(), name='admin-paybox-wallets'),
    path('admin/paybox/transactions/', AdminPayboxTransactionListView.as_view(), name='admin-paybox-transactions'),

    path('chat/messages/<str:room_name>/', chat_history),
    path('favorites/', FavoriteView.as_view(), name='favorites'),
    path('products/<int:pk>/favorite/', check_favorite, name='check-favorite'),
    path('products/<str:pk>/check-purchase/', check_purchase, name='check-purchase'),
]


