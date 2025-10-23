from rest_framework import serializers
from .models import AIConversation, AIMessage, AIAction, AIKnowledgeBase, UserPreference
from api.serializers import ProductSerializer
from api.models import Product


class AIActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIAction
        fields = ['id', 'action_type', 'parameters', 'results', 'success', 'error_message', 'timestamp']


class AIMessageSerializer(serializers.ModelSerializer):
    actions = AIActionSerializer(many=True, read_only=True)
    
    class Meta:
        model = AIMessage
        fields = ['id', 'message_type', 'content', 'metadata', 'timestamp', 'actions']


class AIConversationSerializer(serializers.ModelSerializer):
    messages = AIMessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = AIConversation
        fields = ['id', 'session_id', 'created_at', 'updated_at', 'is_active', 'messages']


class AIKnowledgeBaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIKnowledgeBase
        fields = ['id', 'knowledge_type', 'question', 'answer', 'keywords', 'is_active']


class UserPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreference
        fields = ['preferred_brands', 'preferred_categories', 'size_preferences', 
                 'price_range', 'style_preferences', 'updated_at']


class ChatRequestSerializer(serializers.Serializer):
    """Serializer cho request gửi tin nhắn đến AI"""
    message = serializers.CharField(max_length=1000)
    session_id = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    context = serializers.JSONField(required=False, default=dict)


class ChatResponseSerializer(serializers.Serializer):
    """Serializer cho response từ AI"""
    message = serializers.CharField()
    session_id = serializers.CharField()
    message_type = serializers.CharField()
    actions_taken = serializers.ListField(child=serializers.DictField(), required=False)
    suggested_products = ProductSerializer(many=True, required=False)
    quick_replies = serializers.ListField(child=serializers.CharField(), required=False)
    metadata = serializers.JSONField(required=False, default=dict)
