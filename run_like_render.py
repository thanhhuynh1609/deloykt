#!/usr/bin/env python
import os
import sys
import django
from django.core.management import execute_from_command_line
import dotenv

# Load environment variables
dotenv.load_dotenv()

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings_render')

if __name__ == '__main__':
    print("🚀 Starting local server like Render...")
    print(f"📊 Using settings: {os.getenv('DJANGO_SETTINGS_MODULE')}")
    print(f"🔧 Debug mode: {os.getenv('DEBUG')}")
    print(f"💾 Database: PostgreSQL (Render)")
    print(f"🔴 Redis: Upstash (Render)")
    
    # Run migrations first
    print("\n📝 Running migrations...")
    execute_from_command_line(['manage.py', 'migrate'])
    
    # Collect static files
    print("\n📁 Collecting static files...")
    execute_from_command_line(['manage.py', 'collectstatic', '--noinput'])
    
    # Start server with Daphne (like Render)
    print("\n🌐 Starting Daphne server...")
    os.system('daphne -b 0.0.0.0 -p 8000 backend.asgi:application')