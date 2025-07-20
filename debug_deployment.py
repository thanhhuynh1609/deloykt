#!/usr/bin/env python
"""
Debug script to check deployment status
Run this in Render Shell to diagnose issues
"""
import os
import sys
import django
from django.conf import settings

def check_environment():
    """Check environment variables"""
    print("🔍 Checking Environment Variables...")
    
    required_vars = [
        'SECRET_KEY',
        'DATABASE_URL', 
        'REDIS_URL',
        'DJANGO_SETTINGS_MODULE'
    ]
    
    for var in required_vars:
        value = os.getenv(var)
        if value:
            print(f"✅ {var}: {'*' * 10} (set)")
        else:
            print(f"❌ {var}: Not set")
    
    optional_vars = [
        'STRIPE_PUBLISHABLE_KEY',
        'STRIPE_SECRET_KEY',
        'DEBUG'
    ]
    
    for var in optional_vars:
        value = os.getenv(var)
        if value:
            print(f"🔶 {var}: {'*' * 10} (set)")
        else:
            print(f"⚠️  {var}: Not set")

def check_database():
    """Check database connection"""
    print("\n🗄️ Checking Database Connection...")
    
    try:
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings_render')
        django.setup()
        
        from django.db import connection
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        print("✅ Database connection: OK")
        
        # Check tables
        from django.core.management import execute_from_command_line
        print("📋 Running migrations check...")
        execute_from_command_line(['manage.py', 'showmigrations'])
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")

def check_redis():
    """Check Redis connection"""
    print("\n🔴 Checking Redis Connection...")
    
    try:
        import redis
        redis_url = os.getenv('REDIS_URL')
        if redis_url:
            r = redis.from_url(redis_url)
            r.ping()
            print("✅ Redis connection: OK")
        else:
            print("❌ REDIS_URL not set")
    except Exception as e:
        print(f"❌ Redis connection failed: {e}")

def check_static_files():
    """Check static files"""
    print("\n📁 Checking Static Files...")
    
    try:
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings_render')
        django.setup()
        
        from django.conf import settings
        print(f"📂 STATIC_ROOT: {settings.STATIC_ROOT}")
        print(f"📂 STATIC_URL: {settings.STATIC_URL}")
        
        if os.path.exists(settings.STATIC_ROOT):
            files = os.listdir(settings.STATIC_ROOT)
            print(f"✅ Static files found: {len(files)} items")
        else:
            print("❌ Static root directory not found")
            
    except Exception as e:
        print(f"❌ Static files check failed: {e}")

def main():
    print("🚀 Render Deployment Debug Tool")
    print("=" * 50)
    
    check_environment()
    check_database()
    check_redis()
    check_static_files()
    
    print("\n" + "=" * 50)
    print("🎯 Debug completed!")
    print("\nIf you see ❌ errors above, fix them in Render Dashboard")
    print("Then redeploy your service.")

if __name__ == "__main__":
    main()
