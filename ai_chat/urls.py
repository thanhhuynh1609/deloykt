from django.urls import path
from . import views

urlpatterns = [
    # Test endpoints (no auth required)
    path('test/', views.test_ai_endpoint, name='ai-test'),
    path('debug/', views.debug_ai_chat, name='ai-debug'),
    path('test-search/', views.test_product_search, name='ai-test-search'),

    # User endpoints (auth required)
    path('chat/', views.AIChatView.as_view(), name='ai-chat'),
    path('conversations/', views.ConversationHistoryView.as_view(), name='conversation-history'),
    path('conversations/<str:session_id>/', views.ConversationHistoryView.as_view(), name='conversation-detail'),
    path('recommendations/products/', views.ProductRecommendationView.as_view(), name='product-recommendations'),
    path('recommendations/size/', views.SizeRecommendationView.as_view(), name='size-recommendations'),
    path('preferences/', views.UserPreferenceView.as_view(), name='user-preferences'),
    path('quick-action/', views.quick_action, name='quick-action'),

    # Admin endpoints
    path('admin/stats/', views.AdminChatStatsView.as_view(), name='admin-chat-stats'),
    path('admin/conversations/', views.AdminConversationListView.as_view(), name='admin-conversations'),
    path('admin/knowledge/', views.AdminKnowledgeBaseView.as_view(), name='admin-knowledge'),
    path('admin/knowledge/<int:pk>/', views.AdminKnowledgeBaseDetailView.as_view(), name='admin-knowledge-detail'),
]
