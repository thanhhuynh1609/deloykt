from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import ChatMessage

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def chat_history(request, room_name):
    messages = ChatMessage.objects.filter(room_name=room_name).order_by('timestamp')
    return Response([msg.to_dict() for msg in messages])