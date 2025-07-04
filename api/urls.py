from django.urls import path
from rest_framework.routers import DefaultRouter

from api.views import (
    AdminRefundRequestListView, ApproveRefundRequestView, BrandViewSet, CategoryViewSet, OrderViewSet, ProductViewSet, RefundRequestView,
    ReviewView, ReviewViewSet, StripePaymentView,
    placeOrder, updateOrderToPaid, update_review,
    PayboxWalletView, PayboxTransactionListView, PayboxDepositView,
    PayboxDepositConfirmView, PayboxPaymentView,
    AdminPayboxWalletListView, AdminPayboxTransactionListView
)

router = DefaultRouter()
router.register('brands', BrandViewSet, basename='brands')
router.register('category', CategoryViewSet, basename='category')
router.register('products', ProductViewSet, basename='products')
router.register('orders', OrderViewSet, basename='orders')
router.register('reviews', ReviewViewSet, basename='reviews')

urlpatterns = [*router.urls,
    path('placeorder/', placeOrder, name='create-order'),
    path('orders/<str:pk>/pay/', updateOrderToPaid, name="pay"),
    path('stripe-payment/', StripePaymentView.as_view(),
        name='stipe-payment'),
    path('products/<str:pk>/reviews/', ReviewView.as_view(), name='product-reviews'),
    path('products/<str:pk>/reviews/<str:review_id>/', update_review, name='update-review'),

    # Paybox endpoints
    path('paybox/wallet/', PayboxWalletView.as_view(), name='paybox-wallet'),
    path('paybox/transactions/', PayboxTransactionListView.as_view(), name='paybox-transactions'),
    path('paybox/deposit/', PayboxDepositView.as_view(), name='paybox-deposit'),
    path('paybox/deposit/confirm/', PayboxDepositConfirmView.as_view(), name='paybox-deposit-confirm'),
    path('paybox/payment/', PayboxPaymentView.as_view(), name='paybox-payment'),
    path('api/paybox/refund-requests/', AdminRefundRequestListView.as_view(), name='admin-paybox-refund-requests'),



    path('admin/paybox/refund/<int:order_id>/approve/', ApproveRefundRequestView.as_view(), name='admin-approve-refund'),

    # Admin Paybox endpoints
    path('admin/paybox/wallets/', AdminPayboxWalletListView.as_view(), name='admin-paybox-wallets'),
    path('admin/paybox/transactions/', AdminPayboxTransactionListView.as_view(), name='admin-paybox-transactions'),
]


