from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from ai_chat.serializers import ChatRequestSerializer
from ai_chat.ai_service import AIResponseGenerator
from ai_chat.models import AIConversation, AIMessage
import json


class Command(BaseCommand):
    help = 'Test AI chat functionality'

    def handle(self, *args, **options):
        self.stdout.write('🧪 Testing AI Chat functionality...')
        
        # Test 1: Test serializer
        self.stdout.write('\n1. Testing ChatRequestSerializer...')
        
        # Test with no session_id
        data1 = {"message": "xin chào", "context": {}}
        serializer1 = ChatRequestSerializer(data=data1)
        if serializer1.is_valid():
            self.stdout.write('✅ Serializer valid without session_id')
            self.stdout.write(f'   Validated data: {serializer1.validated_data}')
        else:
            self.stdout.write(f'❌ Serializer invalid: {serializer1.errors}')
        
        # Test with empty session_id
        data2 = {"message": "xin chào", "session_id": "", "context": {}}
        serializer2 = ChatRequestSerializer(data=data2)
        if serializer2.is_valid():
            self.stdout.write('✅ Serializer valid with empty session_id')
            self.stdout.write(f'   Validated data: {serializer2.validated_data}')
        else:
            self.stdout.write(f'❌ Serializer invalid: {serializer2.errors}')
        
        # Test with null session_id
        data3 = {"message": "xin chào", "session_id": None, "context": {}}
        serializer3 = ChatRequestSerializer(data=data3)
        if serializer3.is_valid():
            self.stdout.write('✅ Serializer valid with null session_id')
            self.stdout.write(f'   Validated data: {serializer3.validated_data}')
        else:
            self.stdout.write(f'❌ Serializer invalid: {serializer3.errors}')
        
        # Test 2: Test AI Response Generator
        self.stdout.write('\n2. Testing AIResponseGenerator...')
        try:
            response = AIResponseGenerator.generate_response("xin chào")
            if response and response.get('message'):
                self.stdout.write('✅ AI Response Generator working')
                self.stdout.write(f'   Response: {response["message"][:50]}...')
            else:
                self.stdout.write('❌ AI Response Generator not working properly')
        except Exception as e:
            self.stdout.write(f'❌ AI Response Generator error: {e}')
        
        # Test 3: Test with user (if exists)
        self.stdout.write('\n3. Testing with user...')
        try:
            user = User.objects.first()
            if user:
                self.stdout.write(f'   Using user: {user.username}')
                
                # Test conversation creation
                conversation = AIConversation.objects.create(
                    user=user,
                    session_id='test-session-123'
                )
                self.stdout.write('✅ Conversation created')
                
                # Test message creation
                message = AIMessage.objects.create(
                    conversation=conversation,
                    message_type='user',
                    content='Test message'
                )
                self.stdout.write('✅ Message created')
                
                # Clean up
                conversation.delete()
                self.stdout.write('✅ Test data cleaned up')
                
            else:
                self.stdout.write('⚠️ No users found. Create a user first.')
        except Exception as e:
            self.stdout.write(f'❌ User test error: {e}')
        
        # Test 4: Test knowledge base
        self.stdout.write('\n4. Testing knowledge base...')
        try:
            from ai_chat.models import AIKnowledgeBase
            knowledge_count = AIKnowledgeBase.objects.count()
            self.stdout.write(f'   Knowledge base entries: {knowledge_count}')
            
            if knowledge_count > 0:
                self.stdout.write('✅ Knowledge base has data')
            else:
                self.stdout.write('⚠️ Knowledge base is empty. Run: python manage.py setup_ai_knowledge')
        except Exception as e:
            self.stdout.write(f'❌ Knowledge base error: {e}')
        
        self.stdout.write('\n🎉 AI Chat test completed!')
        self.stdout.write('\n📋 Summary:')
        self.stdout.write('   - If all tests pass, AI Chat should work')
        self.stdout.write('   - Make sure Django server is running')
        self.stdout.write('   - Make sure user is authenticated in frontend')
        self.stdout.write('   - Check browser console for detailed errors')
