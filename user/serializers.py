from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from djoser.serializers import UserSerializer, User
from djoser.conf import settings
from django.contrib.auth.hashers import make_password
from django.contrib.auth import authenticate
from rest_framework_simplejwt.exceptions import InvalidToken

class MyUserSerializer(UserSerializer):
    isAdmin = serializers.SerializerMethodField()

    class Meta(UserSerializer.Meta):
        fields = ('id','email','username','password','isAdmin')
        read_only_fields = ('isAdmin',)
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
        }

    def get_isAdmin(self, obj):
        """Ensure isAdmin is always boolean"""
        return bool(obj.is_staff or obj.is_superuser)

    def update(self, instance, validated_data):
        if (validated_data.get('password')):
            validated_data['password'] = make_password(validated_data['password'])
        return super().update(instance, validated_data)


class AdminUserDeleteSerializer(serializers.Serializer):
    """
    Custom serializer for admin user deletion that doesn't require current password
    """
    pass  # Empty serializer - no validation needed for admin delete


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        # Authenticate user
        user = authenticate(username=username, password=password)
        
        if user is None:
            raise serializers.ValidationError({
                'detail': 'Tài khoản hoặc mật khẩu không đúng'
            })
        
        if not user.is_active:
            raise serializers.ValidationError({
                'detail': 'Tài khoản đã bị vô hiệu hóa'
            })
        
        # Continue with normal JWT token generation
        return super().validate(attrs)
    
# class MyTokenRefreshSerializer(TokenRefreshSerializer):
#     def validate(self, attrs):
#         data = super().validate(attrs)

#         data['username'] = self.user.username
#         data['email'] = self.user.email
#         data['isAdmin'] = self.user.is_staff

#         return data
