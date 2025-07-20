from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Category, Brand
import os


class Command(BaseCommand):
    help = 'Setup production environment with initial data'

    def handle(self, *args, **options):
        self.stdout.write('🚀 Setting up production environment...')
        
        # Create superuser
        self.create_superuser()
        
        # Create sample data
        self.create_sample_data()
        
        self.stdout.write(
            self.style.SUCCESS('✅ Production setup completed!')
        )

    def create_superuser(self):
        """Create superuser if not exists"""
        admin_username = os.getenv('ADMIN_USERNAME', 'admin')
        admin_email = os.getenv('ADMIN_EMAIL', 'admin@example.com')
        admin_password = os.getenv('ADMIN_PASSWORD', 'admin123')
        
        if not User.objects.filter(is_superuser=True).exists():
            User.objects.create_superuser(
                username=admin_username,
                email=admin_email,
                password=admin_password
            )
            self.stdout.write(f'✅ Superuser created: {admin_username}')
        else:
            self.stdout.write('✅ Superuser already exists')

    def create_sample_data(self):
        """Create sample categories and brands"""
        # Sample categories
        categories = [
            {'title': 'Electronics', 'description': 'Electronic devices and gadgets'},
            {'title': 'Clothing', 'description': 'Fashion and apparel'},
            {'title': 'Books', 'description': 'Books and literature'},
            {'title': 'Home & Garden', 'description': 'Home improvement and gardening'},
        ]
        
        for cat_data in categories:
            category, created = Category.objects.get_or_create(
                title=cat_data['title'],
                defaults={'description': cat_data['description']}
            )
            if created:
                self.stdout.write(f'✅ Category created: {category.title}')
        
        # Sample brands
        brands = [
            {'title': 'Apple', 'description': 'Technology company'},
            {'title': 'Nike', 'description': 'Sportswear brand'},
            {'title': 'Samsung', 'description': 'Electronics manufacturer'},
        ]
        
        for brand_data in brands:
            brand, created = Brand.objects.get_or_create(
                title=brand_data['title'],
                defaults={'description': brand_data['description']}
            )
            if created:
                self.stdout.write(f'✅ Brand created: {brand.title}')
