from django.urls import path
from . import views

urlpatterns = [
    path('messages/<str:room_name>/', views.chat_history, name='chat-history'),
]
