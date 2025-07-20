from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from djoser.serializers import UserSerializer, User
from djoser.conf import settings
from django.contrib.auth.hashers import make_password

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
        data = super().validate(attrs)

        data['username'] = self.user.username
        data['email'] = self.user.email
        # Ensure isAdmin is always boolean (not 1/0)
        data['isAdmin'] = bool(self.user.is_staff or self.user.is_superuser)

        return data
    
# class MyTokenRefreshSerializer(TokenRefreshSerializer):
#     def validate(self, attrs):
#         data = super().validate(attrs)

#         data['username'] = self.user.username
#         data['email'] = self.user.email
#         data['isAdmin'] = self.user.is_staff

#         return data