#!/usr/bin/env python
import os
import sys
import dotenv

# Load environment variables FIRST
dotenv.load_dotenv()

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings_render')

if __name__ == '__main__':
    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)