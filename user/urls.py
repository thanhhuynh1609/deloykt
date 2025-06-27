from django.urls import path
from user.views import MyTokenObtainPairView, AdminUserDetailView

urlpatterns = [
    path('auth/jwt/create/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    # path('auth/jwt/refresh/',MyTokenRefreshView.as_view(),name='token_refresh'),
    path('admin/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
]

