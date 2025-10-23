"""
Smart AI Service - Có thể đọc toàn bộ database và nhắn tin thông minh
"""

import re
import json
from typing import Dict, List, Any, Optional
from django.db.models import Q, Count, Avg, Sum, Max, Min
from django.utils import timezone
from django.contrib.auth.models import User
import logging

logger = logging.getLogger(__name__)


class DatabaseReader:
    """Đọc và phân tích toàn bộ database"""
    
    @staticmethod
    def get_all_products():
        """Lấy tất cả sản phẩm"""
        try:
            from api.models import Product
            products = Product.objects.select_related('brand', 'category').all()
            return [
                {
                    'id': p.id,
                    'name': p.name,
                    'description': p.description,
                    'price': float(p.price),
                    'brand': p.brand.title if p.brand else 'Unknown',
                    'category': p.category.title if p.category else 'Unknown',
                    'image': p.image.url if p.image else None
                }
                for p in products
            ]
        except Exception as e:
            logger.error(f"Error getting products: {e}")
            return []
    
    @staticmethod
    def get_all_brands():
        """Lấy tất cả thương hiệu"""
        try:
            from api.models import Brand
            brands = Brand.objects.annotate(product_count=Count('product')).all()
            return [
                {
                    'id': b.id,
                    'title': b.title,
                    'product_count': b.product_count
                }
                for b in brands
            ]
        except Exception as e:
            logger.error(f"Error getting brands: {e}")
            return []
    
    @staticmethod
    def get_all_categories():
        """Lấy tất cả danh mục"""
        try:
            from api.models import Category
            categories = Category.objects.annotate(product_count=Count('product')).all()
            return [
                {
                    'id': c.id,
                    'title': c.title,
                    'product_count': c.product_count
                }
                for c in categories
            ]
        except Exception as e:
            logger.error(f"Error getting categories: {e}")
            return []
    
    @staticmethod
    def get_database_stats():
        """Lấy thống kê tổng quan"""
        try:
            from api.models import Product, Brand, Category
            
            # Product stats
            product_stats = Product.objects.aggregate(
                total=Count('id'),
                avg_price=Avg('price'),
                min_price=Min('price'),
                max_price=Max('price')
            )
            
            # Top brands
            top_brands = Brand.objects.annotate(
                product_count=Count('product')
            ).order_by('-product_count')[:5]
            
            # Top categories
            top_categories = Category.objects.annotate(
                product_count=Count('product')
            ).order_by('-product_count')[:5]
            
            return {
                'products': {
                    'total': product_stats['total'] or 0,
                    'avg_price': product_stats['avg_price'] or 0,
                    'min_price': product_stats['min_price'] or 0,
                    'max_price': product_stats['max_price'] or 0
                },
                'brands': {
                    'total': Brand.objects.count(),
                    'top': [{'title': b.title, 'products': b.product_count} for b in top_brands]
                },
                'categories': {
                    'total': Category.objects.count(),
                    'top': [{'name': c.title, 'products': c.product_count} for c in top_categories]
                }
            }
        except Exception as e:
            logger.error(f"Error getting stats: {e}")
            return {}
    
    @staticmethod
    def search_products(query: str, filters: Dict = None):
        """Tìm kiếm sản phẩm thông minh"""
        try:
            from api.models import Product
            from django.db.models import Q

            # Base query
            products = Product.objects.select_related('brand', 'category')

            # Text search với từ khóa riêng lẻ
            if query:
                # Tách từ khóa và loại bỏ stop words
                stop_words = ['tìm', 'có', 'bán', 'shop', 'màu', 'size', 'cỡ', 'giá', 'vnd', 'đồng', 'không', 'gì']
                important_keywords = ['áo', 'quần', 'giày', 'dép']  # Từ khóa sản phẩm quan trọng

                keywords = []
                for word in query.lower().split():
                    word = word.strip()
                    # Giữ lại từ khóa quan trọng hoặc từ dài hơn 2 ký tự (không phải stop word)
                    if word in important_keywords or (len(word) > 2 and word not in stop_words):
                        keywords.append(word)

                if keywords:
                    search_q = Q()
                    for keyword in keywords:
                        search_q |= (
                            Q(name__icontains=keyword) |
                            Q(description__icontains=keyword) |
                            Q(brand__title__icontains=keyword) |
                            Q(category__title__icontains=keyword)
                        )
                    products = products.filter(search_q)
                else:
                    # Nếu không có keyword hợp lệ, tìm theo category chung
                    query_lower = query.lower()
                    if any(word in query_lower for word in ['áo', 'shirt', 'top']):
                        products = products.filter(Q(category__title__icontains='áo'))
                    elif any(word in query_lower for word in ['quần', 'pants', 'jean']):
                        products = products.filter(Q(category__title__icontains='quần'))
                    elif any(word in query_lower for word in ['giày', 'shoes', 'sneaker']):
                        products = products.filter(Q(category__title__icontains='giày'))
            
            # Apply filters
            if filters:
                if filters.get('brand'):
                    products = products.filter(brand__title__icontains=filters['brand'])
                if filters.get('category'):
                    products = products.filter(category__title__icontains=filters['category'])
                if filters.get('min_price'):
                    products = products.filter(price__gte=filters['min_price'])
                if filters.get('max_price'):
                    products = products.filter(price__lte=filters['max_price'])
                if filters.get('color'):
                    products = products.filter(variants__color__name__icontains=filters['color'])
                if filters.get('size'):
                    products = products.filter(variants__size__name__icontains=filters['size'])

            # Serialize results
            results = []
            for p in products[:20]:  # Limit to 20 results
                results.append({
                    'id': p.id,
                    'name': p.name,
                    'description': p.description,
                    'price': float(p.price),
                    'brand': p.brand.title if p.brand else 'Unknown',
                    'category': p.category.title if p.category else 'Unknown',
                    'image': p.image.url if p.image else None
                })
            
            return results
        except Exception as e:
            logger.error(f"Error searching products: {e}")
            return []


class SmartAIProcessor:
    """AI processor thông minh"""
    
    def __init__(self):
        self.db_reader = DatabaseReader()
    
    def process_message(self, message: str, user=None) -> Dict:
        """Xử lý tin nhắn thông minh"""
        try:
            message_lower = message.lower()
            
            # Detect intent và xử lý
            if self._is_database_query(message_lower):
                return self._handle_database_query(message_lower)
            elif self._is_product_search(message_lower):
                return self._handle_product_search(message, message_lower)
            elif self._is_stats_request(message_lower):
                return self._handle_stats_request(message_lower)
            elif self._is_recommendation_request(message_lower):
                return self._handle_recommendation(message_lower, user)
            else:
                return self._handle_general_chat(message)
                
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            return self._generate_error_response()
    
    def _is_database_query(self, message: str) -> bool:
        """Kiểm tra có phải query database không"""
        keywords = [
            'có bao nhiêu', 'tổng cộng', 'số lượng', 'danh sách', 'liệt kê',
            'cho tôi biết', 'hiển thị', 'tất cả', 'toàn bộ'
        ]
        return any(keyword in message for keyword in keywords)
    
    def _is_product_search(self, message: str) -> bool:
        """Kiểm tra có phải tìm sản phẩm không"""
        # Từ khóa tìm kiếm trực tiếp
        search_keywords = ['tìm', 'search', 'mua', 'cần', 'muốn']

        # Từ khóa sản phẩm
        product_keywords = ['áo', 'quần', 'giày', 'dép', 'sản phẩm']

        # Từ khóa hỏi về sản phẩm
        inquiry_keywords = ['có', 'bán', 'shop']

        # Từ khóa size (để nhận diện "size 42" là product search)
        size_keywords = ['size', 'cỡ', 'kích thước']

        # Kiểm tra các pattern
        has_search = any(keyword in message for keyword in search_keywords)
        has_product = any(keyword in message for keyword in product_keywords)
        has_inquiry = any(keyword in message for keyword in inquiry_keywords)
        has_size = any(keyword in message for keyword in size_keywords)

        # Nếu có từ khóa tìm kiếm hoặc (có từ khóa hỏi + từ khóa sản phẩm) hoặc có size
        return has_search or (has_inquiry and has_product) or has_product or has_size
    
    def _is_stats_request(self, message: str) -> bool:
        """Kiểm tra có phải yêu cầu thống kê không"""
        keywords = [
            'thống kê', 'báo cáo', 'doanh thu', 'bán chạy', 'top', 'phổ biến',
            'nhiều nhất', 'ít nhất', 'trung bình'
        ]
        return any(keyword in message for keyword in keywords)
    
    def _is_recommendation_request(self, message: str) -> bool:
        """Kiểm tra có phải yêu cầu gợi ý không"""
        keywords = [
            'gợi ý', 'recommend', 'tư vấn', 'nên mua', 'phù hợp', 'đề xuất'
        ]
        return any(keyword in message for keyword in keywords)
    
    def _handle_database_query(self, message: str) -> Dict:
        """Xử lý query database"""
        try:
            response_text = ""
            
            if 'sản phẩm' in message:
                products = self.db_reader.get_all_products()
                response_text = f"📊 **Database có tổng cộng {len(products)} sản phẩm:**\n\n"
                
                # Group by category
                categories = {}
                for product in products:
                    cat = product['category']
                    if cat not in categories:
                        categories[cat] = []
                    categories[cat].append(product)
                
                for cat, prods in categories.items():
                    response_text += f"**{cat}**: {len(prods)} sản phẩm\n"
                
                response_text += f"\n💰 **Giá trung bình**: {sum(p['price'] for p in products) / len(products):,.0f} VND"
            
            elif 'thương hiệu' in message or 'brand' in message:
                brands = self.db_reader.get_all_brands()
                response_text = f"🏷️ **Database có {len(brands)} thương hiệu:**\n\n"
                
                for brand in brands[:10]:  # Top 10
                    response_text += f"• **{brand['title']}**: {brand['product_count']} sản phẩm\n"
            
            elif 'danh mục' in message or 'category' in message:
                categories = self.db_reader.get_all_categories()
                response_text = f"📂 **Database có {len(categories)} danh mục:**\n\n"
                
                for cat in categories:
                    response_text += f"• **{cat['title']}**: {cat['product_count']} sản phẩm\n"
            
            else:
                stats = self.db_reader.get_database_stats()
                response_text = f"📊 **Tổng quan Database:**\n\n"
                response_text += f"🛍️ **Sản phẩm**: {stats['products']['total']}\n"
                response_text += f"🏷️ **Thương hiệu**: {stats['brands']['total']}\n"
                response_text += f"📂 **Danh mục**: {stats['categories']['total']}\n"
                response_text += f"💰 **Giá trung bình**: {stats['products']['avg_price']:,.0f} VND\n"
                response_text += f"💸 **Giá thấp nhất**: {stats['products']['min_price']:,.0f} VND\n"
                response_text += f"💎 **Giá cao nhất**: {stats['products']['max_price']:,.0f} VND"
            
            return {
                'message': response_text,
                'quick_replies': ['Xem sản phẩm', 'Thống kê chi tiết', 'Tìm sản phẩm'],
                'metadata': {'intent': 'database_query', 'type': 'success'}
            }
            
        except Exception as e:
            logger.error(f"Error handling database query: {e}")
            return self._generate_error_response()
    
    def _handle_product_search(self, original_message: str, message: str) -> Dict:
        """Xử lý tìm kiếm sản phẩm"""
        try:
            # Extract filters
            filters = self._extract_filters(message)
            
            # Search products
            products = self.db_reader.search_products(original_message, filters)
            
            if products:
                response_text = f"🛍️ **Tìm thấy {len(products)} sản phẩm phù hợp:**\n\n"
                
                # Show first 3 products in text
                for i, product in enumerate(products[:3], 1):
                    response_text += f"{i}. **{product['name']}**\n"
                    response_text += f"   💰 {product['price']:,.0f} VND\n"
                    response_text += f"   🏷️ {product['brand']} - {product['category']}\n"
                    response_text += f"   👉 [Xem chi tiết](/#/products/{product['id']})\n\n"
                
                if len(products) > 3:
                    response_text += f"...và **{len(products) - 3} sản phẩm khác** bên dưới!"
                
                return {
                    'message': response_text,
                    'suggested_products': products,
                    'quick_replies': ['Xem tất cả', 'Lọc theo giá', 'Tìm khác'],
                    'metadata': {'intent': 'product_search', 'results_count': len(products)}
                }
            else:
                return {
                    'message': 'Xin lỗi, không tìm thấy sản phẩm nào phù hợp. Bạn có thể thử:\n\n• Mô tả chi tiết hơn\n• Tìm theo thương hiệu\n• Xem tất cả sản phẩm',
                    'quick_replies': ['Xem tất cả sản phẩm', 'Thương hiệu phổ biến', 'Hỗ trợ'],
                    'metadata': {'intent': 'product_search', 'results_count': 0}
                }
                
        except Exception as e:
            logger.error(f"Error handling product search: {e}")
            return self._generate_error_response()
    
    def _extract_filters(self, message: str) -> Dict:
        """Extract filters từ message"""
        filters = {}
        
        # Extract brand
        brands = self.db_reader.get_all_brands()
        for brand in brands:
            if brand['title'].lower() in message:
                filters['brand'] = brand['title']
                break
        
        # Extract category
        categories = self.db_reader.get_all_categories()
        for cat in categories:
            if cat['title'].lower() in message:
                filters['category'] = cat['title']
                break
        
        # Extract price range
        price_patterns = [
            r'dưới\s+(\d+)k?',
            r'từ\s+(\d+)k?\s+đến\s+(\d+)k?',
            r'khoảng\s+(\d+)k?'
        ]
        
        for pattern in price_patterns:
            match = re.search(pattern, message)
            if match:
                if len(match.groups()) == 1:
                    price = int(match.group(1)) * 1000
                    if 'dưới' in pattern:
                        filters['max_price'] = price
                    else:
                        filters['min_price'] = price - 100000
                        filters['max_price'] = price + 100000
                elif len(match.groups()) == 2:
                    filters['min_price'] = int(match.group(1)) * 1000
                    filters['max_price'] = int(match.group(2)) * 1000
                break
        
        # Extract color với mapping chi tiết hơn
        color_mapping = {
            'đỏ': ['đỏ', 'red'],
            'xanh dương': ['xanh dương', 'xanh', 'blue', 'navy'],
            'xanh lá': ['xanh lá', 'green'],
            'vàng': ['vàng', 'yellow'],
            'đen': ['đen', 'black'],
            'trắng': ['trắng', 'white'],
            'xám': ['xám', 'gray', 'grey'],
            'nâu': ['nâu', 'brown'],
            'hồng': ['hồng', 'pink'],
            'tím': ['tím', 'purple'],
            'cam': ['cam', 'orange']
        }

        for color_name, keywords in color_mapping.items():
            if any(keyword in message for keyword in keywords):
                filters['color'] = color_name
                break

        # Extract size
        # Tìm size dạng số (36-43)
        size_number_match = re.search(r'\b(3[6-9]|4[0-3])\b', message)
        if size_number_match:
            filters['size'] = size_number_match.group(1)
        else:
            # Tìm size dạng chữ (XS, S, M, L, XL, XXL) với word boundary
            size_patterns = [
                (r'\bxxl\b', 'XXL'),
                (r'\bxl\b', 'XL'),
                (r'\bl\b', 'L'),
                (r'\bm\b', 'M'),
                (r'\bs\b', 'S'),
                (r'\bxs\b', 'XS'),
                (r'\b2xl\b', 'XXL'),
                (r'extra\s+large', 'XL'),
                (r'extra\s+extra\s+large', 'XXL'),
                (r'extra\s+small', 'XS'),
                (r'\blarge\b', 'L'),
                (r'\bmedium\b', 'M'),
                (r'\bsmall\b', 'S')
            ]

            message_lower = message.lower()
            for pattern, size_name in size_patterns:
                if re.search(pattern, message_lower):
                    filters['size'] = size_name
                    break

        return filters
    
    def _handle_stats_request(self, message: str) -> Dict:
        """Xử lý yêu cầu thống kê"""
        try:
            stats = self.db_reader.get_database_stats()
            
            response_text = "📊 **Thống kê Shop:**\n\n"
            
            # Product stats
            response_text += f"🛍️ **Sản phẩm**: {stats['products']['total']}\n"
            response_text += f"💰 **Giá trung bình**: {stats['products']['avg_price']:,.0f} VND\n"
            response_text += f"💸 **Giá thấp nhất**: {stats['products']['min_price']:,.0f} VND\n"
            response_text += f"💎 **Giá cao nhất**: {stats['products']['max_price']:,.0f} VND\n\n"
            
            # Top brands
            response_text += "🏆 **Top Thương hiệu:**\n"
            for brand in stats['brands']['top']:
                response_text += f"• {brand['title']}: {brand['products']} sản phẩm\n"
            
            response_text += "\n🏆 **Top Danh mục:**\n"
            for cat in stats['categories']['top']:
                response_text += f"• {cat['name']}: {cat['products']} sản phẩm\n"
            
            return {
                'message': response_text,
                'quick_replies': ['Chi tiết thương hiệu', 'Chi tiết danh mục', 'Sản phẩm bán chạy'],
                'metadata': {'intent': 'stats_request', 'type': 'overview'}
            }
            
        except Exception as e:
            logger.error(f"Error handling stats request: {e}")
            return self._generate_error_response()
    
    def _handle_recommendation(self, message: str, user=None) -> Dict:
        """Xử lý gợi ý sản phẩm"""
        try:
            # Get random products for recommendation
            products = self.db_reader.search_products("", {})
            
            if products:
                # Get top 5 random products
                import random
                recommended = random.sample(products, min(5, len(products)))
                
                response_text = "💡 **Gợi ý sản phẩm cho bạn:**\n\n"
                
                for i, product in enumerate(recommended[:3], 1):
                    response_text += f"{i}. **{product['name']}**\n"
                    response_text += f"   💰 {product['price']:,.0f} VND\n"
                    response_text += f"   🏷️ {product['brand']} - {product['category']}\n"
                    response_text += f"   👉 [Xem ngay](/#/products/{product['id']})\n\n"
                
                return {
                    'message': response_text,
                    'suggested_products': recommended,
                    'quick_replies': ['Xem thêm gợi ý', 'Tìm theo sở thích', 'Sản phẩm hot'],
                    'metadata': {'intent': 'recommendation', 'count': len(recommended)}
                }
            else:
                return {
                    'message': 'Hiện tại chưa có sản phẩm để gợi ý. Vui lòng quay lại sau!',
                    'quick_replies': ['Xem tất cả sản phẩm', 'Liên hệ hỗ trợ'],
                    'metadata': {'intent': 'recommendation', 'count': 0}
                }
                
        except Exception as e:
            logger.error(f"Error handling recommendation: {e}")
            return self._generate_error_response()
    
    def _handle_general_chat(self, message: str) -> Dict:
        """Xử lý chat chung"""
        message_lower = message.lower()
        
        if any(word in message_lower for word in ['xin chào', 'hello', 'hi', 'chào']):
            return {
                'message': 'Xin chào! 👋 Tôi là AI assistant của shop. Tôi có thể:\n\n🔍 Tìm kiếm sản phẩm\n📊 Cung cấp thống kê\n💡 Gợi ý sản phẩm\n📋 Trả lời mọi câu hỏi về database\n\nBạn cần hỗ trợ gì?',
                'quick_replies': ['Tìm sản phẩm', 'Xem thống kê', 'Gợi ý cho tôi', 'Hỗ trợ'],
                'metadata': {'intent': 'greeting'}
            }
        else:
            return {
                'message': 'Tôi có thể giúp bạn tìm sản phẩm, xem thống kê, hoặc trả lời câu hỏi về shop. Bạn muốn làm gì?',
                'quick_replies': ['Tìm sản phẩm', 'Xem database', 'Thống kê shop', 'Gợi ý'],
                'metadata': {'intent': 'general'}
            }
    
    def _generate_error_response(self) -> Dict:
        """Tạo response khi có lỗi"""
        return {
            'message': 'Xin lỗi, có lỗi xảy ra. Tôi vẫn có thể giúp bạn:\n\n🔍 Tìm sản phẩm\n📊 Xem thống kê\n💬 Trò chuyện chung',
            'quick_replies': ['Tìm sản phẩm', 'Thống kê', 'Thử lại'],
            'metadata': {'intent': 'error'}
        }


# Global instance
smart_ai = SmartAIProcessor()
