from django.shortcuts import get_object_or_404
from rest_framework_simplejwt.views import TokenObtainPairView
from user.serializers import MyTokenObtainPairSerializer
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from .serializers import MyUserSerializer
from django.views.decorators.csrf import csrf_exempt

User = get_user_model()

# Create your views here.
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


# class MyTokenRefreshView(TokenRefreshView):
#     serializer_class = MyTokenRefreshSerializer

class AdminUserDetailView(APIView):
    """
    API endpoint cho admin để cập nhật hoặc xóa người dùng
    """
    permission_classes = [IsAdminUser]

    def put(self, request, pk):
        print(f"AdminUserDetailView PUT called: /admin/users/{pk}/")
        print(f"User: {request.user}")
        print(f"Is authenticated: {request.user.is_authenticated}")
        print(f"Is admin: {request.user.is_staff}")
        print(f"Headers: {dict(request.headers)}")
        print(f"PUT data: {request.data}")

        user = get_object_or_404(User, id=pk)
        serializer = MyUserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        print(f"Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        print(f"AdminUserDetailView DELETE called: /admin/users/{pk}/")
        print(f"User: {request.user}")

        user = get_object_or_404(User, id=pk)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# Keep the old function for backward compatibility
@csrf_exempt
@api_view(['PUT', 'DELETE'])
@permission_classes([IsAdminUser])
def admin_user_detail(request, pk):
    """
    API endpoint cho admin để cập nhật hoặc xóa người dùng
    """
    print(f"admin_user_detail called: {request.method} /admin/users/{pk}/")
    print(f"User: {request.user}")
    print(f"Is authenticated: {request.user.is_authenticated}")
    print(f"Is admin: {request.user.is_staff}")
    print(f"Headers: {dict(request.headers)}")

    try:
        user = User.objects.get(id=pk)
    except User.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        print(f"PUT data: {request.data}")
        serializer = MyUserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        print(f"Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

