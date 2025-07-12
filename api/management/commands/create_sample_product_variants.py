from django.core.management.base import BaseCommand
from api.models import Product, Color, Size, ProductVariant, Brand, Category


class Command(BaseCommand):
    help = 'Tạo sản phẩm mẫu có biến thể để test'

    def handle(self, *args, **options):
        # Lấy brand và category đầu tiên
        try:
            brand = Brand.objects.first()
            category = Category.objects.first()
            
            if not brand or not category:
                self.stdout.write(self.style.ERROR('Cần có ít nhất 1 brand và 1 category'))
                return
                
            # Tạo sản phẩm áo thun có biến thể
            product, created = Product.objects.get_or_create(
                name="Áo thun cotton cao cấp",
                defaults={
                    'description': 'Áo thun cotton 100% cao cấp, thoáng mát, thấm hút mồ hôi tốt',
                    'brand': brand,
                    'category': category,
                    'price': 200000,  # Giá cơ bản
                    'countInStock': 0,  # Sẽ tính từ biến thể
                    'has_variants': True,
                    'rating': 4.5,
                    'numReviews': 25
                }
            )
            
            if created:
                self.stdout.write(f'Đã tạo sản phẩm: {product.name}')
            else:
                self.stdout.write(f'Sản phẩm đã tồn tại: {product.name}')
                # Xóa biến thể cũ để tạo mới
                ProductVariant.objects.filter(product=product).delete()
            
            # Lấy màu sắc và size
            colors = {
                'Đỏ': Color.objects.filter(name='Đỏ').first(),
                'Xanh dương': Color.objects.filter(name='Xanh dương').first(),
                'Đen': Color.objects.filter(name='Đen').first(),
            }
            
            sizes = {
                'M': Size.objects.filter(name='M').first(),
                'L': Size.objects.filter(name='L').first(),
                'XL': Size.objects.filter(name='XL').first(),
            }
            
            # Tạo biến thể
            variants_data = [
                ('Đỏ', 'M', 200000, 50),
                ('Đỏ', 'L', 220000, 30),
                ('Đỏ', 'XL', 240000, 20),
                ('Xanh dương', 'M', 200000, 40),
                ('Xanh dương', 'L', 220000, 25),
                ('Đen', 'M', 210000, 35),
                ('Đen', 'L', 230000, 15),
                ('Đen', 'XL', 250000, 10),
            ]
            
            for color_name, size_name, price, stock in variants_data:
                color = colors.get(color_name)
                size = sizes.get(size_name)
                
                if color and size:
                    variant, created = ProductVariant.objects.get_or_create(
                        product=product,
                        color=color,
                        size=size,
                        defaults={
                            'price': price,
                            'stock_quantity': stock
                        }
                    )
                    
                    if created:
                        self.stdout.write(f'  ✓ Tạo biến thể: {color_name} - {size_name} - {price:,} VND - {stock} cái')
                    else:
                        # Cập nhật nếu đã tồn tại
                        variant.price = price
                        variant.stock_quantity = stock
                        variant.save()
                        self.stdout.write(f'  ↻ Cập nhật biến thể: {color_name} - {size_name} - {price:,} VND - {stock} cái')
                else:
                    self.stdout.write(f'  ✗ Không tìm thấy màu {color_name} hoặc size {size_name}')
            
            # Tạo thêm sản phẩm giày có biến thể
            shoe_product, created = Product.objects.get_or_create(
                name="Giày thể thao nam",
                defaults={
                    'description': 'Giày thể thao nam cao cấp, đế êm, phù hợp vận động',
                    'brand': brand,
                    'category': category,
                    'price': 800000,  # Giá cơ bản
                    'countInStock': 0,  # Sẽ tính từ biến thể
                    'has_variants': True,
                    'rating': 4.2,
                    'numReviews': 18
                }
            )
            
            if created:
                self.stdout.write(f'Đã tạo sản phẩm: {shoe_product.name}')
            else:
                self.stdout.write(f'Sản phẩm đã tồn tại: {shoe_product.name}')
                # Xóa biến thể cũ để tạo mới
                ProductVariant.objects.filter(product=shoe_product).delete()
            
            # Tạo biến thể cho giày
            shoe_sizes = {
                '39': Size.objects.filter(name='39').first(),
                '40': Size.objects.filter(name='40').first(),
                '41': Size.objects.filter(name='41').first(),
                '42': Size.objects.filter(name='42').first(),
                '43': Size.objects.filter(name='43').first(),
            }
            
            shoe_variants_data = [
                ('Đen', '39', 800000, 15),
                ('Đen', '40', 800000, 20),
                ('Đen', '41', 800000, 25),
                ('Đen', '42', 800000, 18),
                ('Đen', '43', 800000, 12),
                ('Xanh dương', '40', 850000, 10),
                ('Xanh dương', '41', 850000, 15),
                ('Xanh dương', '42', 850000, 8),
            ]
            
            for color_name, size_name, price, stock in shoe_variants_data:
                color = colors.get(color_name)
                size = shoe_sizes.get(size_name)
                
                if color and size:
                    variant, created = ProductVariant.objects.get_or_create(
                        product=shoe_product,
                        color=color,
                        size=size,
                        defaults={
                            'price': price,
                            'stock_quantity': stock
                        }
                    )
                    
                    if created:
                        self.stdout.write(f'  ✓ Tạo biến thể giày: {color_name} - {size_name} - {price:,} VND - {stock} đôi')
                    else:
                        # Cập nhật nếu đã tồn tại
                        variant.price = price
                        variant.stock_quantity = stock
                        variant.save()
                        self.stdout.write(f'  ↻ Cập nhật biến thể giày: {color_name} - {size_name} - {price:,} VND - {stock} đôi')
                else:
                    self.stdout.write(f'  ✗ Không tìm thấy màu {color_name} hoặc size {size_name}')
            
            self.stdout.write(
                self.style.SUCCESS('Đã tạo xong sản phẩm mẫu có biến thể!')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Lỗi: {str(e)}')
            )
