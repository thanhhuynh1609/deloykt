from django.db import models
from django.conf import settings

class ChatMessage(models.Model):
    room_name = models.CharField(max_length=255)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def to_dict(self):
        return {
            "id": self.id,
            "room_name": self.room_name,
            "sender_id": self.sender.id,
            "message": self.message,
            "timestamp": self.timestamp.isoformat(),
        }
