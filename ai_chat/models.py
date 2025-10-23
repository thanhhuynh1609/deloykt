from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import json


class AIConversation(models.Model):
    """Lưu trữ cuộc hội thoại với AI"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_conversations')
    session_id = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"Conversation {self.session_id} - {self.user.username}"


class AIMessage(models.Model):
    """Lưu trữ tin nhắn trong cuộc hội thoại AI"""
    MESSAGE_TYPES = [
        ('user', 'User Message'),
        ('ai', 'AI Response'),
        ('system', 'System Message'),
    ]
    
    conversation = models.ForeignKey(AIConversation, on_delete=models.CASCADE, related_name='messages')
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES)
    content = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)  # Lưu thông tin thêm như products found, actions taken
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['timestamp']
    
    def __str__(self):
        return f"{self.message_type}: {self.content[:50]}..."


class AIAction(models.Model):
    """Lưu trữ các hành động AI đã thực hiện"""
    ACTION_TYPES = [
        ('product_search', 'Product Search'),
        ('size_recommendation', 'Size Recommendation'),
        ('order_assistance', 'Order Assistance'),
        ('price_inquiry', 'Price Inquiry'),
        ('stock_check', 'Stock Check'),
        ('general_help', 'General Help'),
    ]
    
    message = models.ForeignKey(AIMessage, on_delete=models.CASCADE, related_name='actions')
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES)
    parameters = models.JSONField(default=dict)  # Tham số của action
    results = models.JSONField(default=dict)     # Kết quả của action
    success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.action_type} - {self.success}"


class AIKnowledgeBase(models.Model):
    """Cơ sở tri thức cho AI"""
    KNOWLEDGE_TYPES = [
        ('faq', 'Frequently Asked Questions'),
        ('product_info', 'Product Information'),
        ('size_guide', 'Size Guide'),
        ('policy', 'Store Policy'),
        ('general', 'General Information'),
    ]
    
    knowledge_type = models.CharField(max_length=20, choices=KNOWLEDGE_TYPES)
    question = models.TextField()
    answer = models.TextField()
    keywords = models.JSONField(default=list)  # Keywords để search
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['knowledge_type', 'question']
    
    def __str__(self):
        return f"{self.knowledge_type}: {self.question[:50]}..."


class UserPreference(models.Model):
    """Lưu trữ sở thích của user để AI có thể đưa ra gợi ý tốt hơn"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='ai_preferences')
    preferred_brands = models.JSONField(default=list)
    preferred_categories = models.JSONField(default=list)
    size_preferences = models.JSONField(default=dict)  # {"shirt": "L", "shoes": "42"}
    price_range = models.JSONField(default=dict)       # {"min": 100000, "max": 1000000}
    style_preferences = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Preferences for {self.user.username}"
