from django.core.management.base import BaseCommand
from api.models import Product, OrderItem, Order
from django.db.models import Sum, F, Q

class Command(BaseCommand):
    help = 'Update total_sold field for all products based on order history'

    def handle(self, *args, **options):
        # Lấy tất cả sản phẩm
        products = Product.objects.all()
        
        # Cập nhật từng sản phẩm
        for product in products:
            # Tính tổng số lượng đã bán từ các đơn hàng đã thanh toán
            total_sold = OrderItem.objects.filter(
                product=product,
                order__isPaid=True
            ).aggregate(
                total=Sum('qty')
            )['total'] or 0
            
            # Cập nhật trường total_sold
            product.total_sold = total_sold
            product.save()
            
            self.stdout.write(
                self.style.SUCCESS(f'Updated product "{product.name}" with total_sold={total_sold}')
            )
        
        self.stdout.write(
            self.style.SUCCESS('Successfully updated total_sold for all products')
        )