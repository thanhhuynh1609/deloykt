from django.core.management.base import BaseCommand
from api.models import Color, Size, Product, ProductVariant


class Command(BaseCommand):
    help = 'Tạo dữ liệu mẫu cho màu sắc, size và biến thể sản phẩm'

    def handle(self, *args, **options):
        # Tạo màu sắc
        colors_data = [
            {'name': 'Đỏ', 'hex_code': '#FF0000'},
            {'name': 'Xanh dương', 'hex_code': '#0000FF'},
            {'name': 'Xanh lá', 'hex_code': '#00FF00'},
            {'name': 'Đen', 'hex_code': '#000000'},
            {'name': 'Trắng', 'hex_code': '#FFFFFF'},
            {'name': 'Vàng', 'hex_code': '#FFFF00'},
            {'name': 'Hồng', 'hex_code': '#FFC0CB'},
            {'name': 'Tím', 'hex_code': '#800080'},
            {'name': 'Cam', 'hex_code': '#FFA500'},
            {'name': 'Xám', 'hex_code': '#808080'},
        ]

        for color_data in colors_data:
            color, created = Color.objects.get_or_create(
                name=color_data['name'],
                defaults={'hex_code': color_data['hex_code']}
            )
            if created:
                self.stdout.write(f'Đã tạo màu: {color.name}')

        # Tạo size
        sizes_data = [
            {'name': 'XS', 'order': 1},
            {'name': 'S', 'order': 2},
            {'name': 'M', 'order': 3},
            {'name': 'L', 'order': 4},
            {'name': 'XL', 'order': 5},
            {'name': 'XXL', 'order': 6},
            {'name': '36', 'order': 7},
            {'name': '37', 'order': 8},
            {'name': '38', 'order': 9},
            {'name': '39', 'order': 10},
            {'name': '40', 'order': 11},
            {'name': '41', 'order': 12},
            {'name': '42', 'order': 13},
            {'name': '43', 'order': 14},
        ]

        for size_data in sizes_data:
            size, created = Size.objects.get_or_create(
                name=size_data['name'],
                defaults={'order': size_data['order']}
            )
            if created:
                self.stdout.write(f'Đã tạo size: {size.name}')

        self.stdout.write(
            self.style.SUCCESS('Đã tạo xong dữ liệu mẫu cho màu sắc và size!')
        )
