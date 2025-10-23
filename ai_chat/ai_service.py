import json
import re
from typing import Dict, List, Tuple, Optional
from django.db.models import Q
from api.models import Product, ProductVariant, Brand, Category, Color, Size
from .models import AIKnowledgeBase, UserPreference
import logging
import random

logger = logging.getLogger(__name__)


class AILanguageProcessor:
    """Xử lý ngôn ngữ tự nhiên nâng cao cho tiếng Việt"""

    # Từ đồng nghĩa cho các intent
    SEARCH_SYNONYMS = [
        'tìm', 'search', 'tìm kiếm', 'có', 'bán', 'sản phẩm', 'hàng', 'đồ',
        'áo', 'quần', 'giày', 'dép', 'túi', 'phụ kiện', 'mua', 'cần', 'muốn',
        'shop', 'store', 'còn', 'bày bán', 'kinh doanh'
    ]

    SIZE_SYNONYMS = [
        'size', 'cỡ', 'số', 'kích thước', 'vừa', 'to', 'nhỏ', 'lớn', 'bé',
        'chọn size', 'size nào', 'đo size', 'hướng dẫn', 'bảng size'
    ]

    ORDER_SYNONYMS = [
        'đặt hàng', 'order', 'mua', 'thanh toán', 'giỏ hàng', 'cart',
        'checkout', 'đặt', 'giao hàng', 'ship', 'delivery'
    ]

    GREETING_SYNONYMS = [
        'xin chào', 'hello', 'hi', 'chào', 'hey', 'good morning', 'good afternoon',
        'chào bạn', 'chào shop', 'alo'
    ]

    PRICE_SYNONYMS = [
        'giá', 'price', 'bao nhiêu', 'cost', 'tiền', 'phí', 'rẻ', 'đắt',
        'khuyến mãi', 'sale', 'giảm giá', 'ưu đãi', 'discount'
    ]

    # Thương hiệu phổ biến
    BRAND_KEYWORDS = {
        'nike': ['nike', 'nike air', 'air jordan'],
        'adidas': ['adidas', 'three stripes', '3 sọc'],
        'zara': ['zara'],
        'h&m': ['h&m', 'hm'],
        'uniqlo': ['uniqlo'],
        'gucci': ['gucci'],
        'louis vuitton': ['lv', 'louis vuitton'],
        'chanel': ['chanel'],
        'puma': ['puma'],
        'converse': ['converse', 'chuck taylor']
    }

    # Danh mục sản phẩm
    CATEGORY_KEYWORDS = {
        'áo': ['áo', 'shirt', 'top', 'áo thun', 'áo polo', 'áo khoác', 'hoodie', 'sweater'],
        'quần': ['quần', 'pants', 'jean', 'jeans', 'quần jean', 'quần tây', 'short', 'quần short'],
        'giày': ['giày', 'shoes', 'sneaker', 'boot', 'sandal', 'dép', 'giày thể thao'],
        'túi': ['túi', 'bag', 'backpack', 'handbag', 'túi xách', 'balo'],
        'phụ kiện': ['phụ kiện', 'accessory', 'mũ', 'hat', 'belt', 'thắt lưng', 'kính']
    }

    @staticmethod
    def extract_intent(message: str) -> str:
        """Trích xuất intent từ tin nhắn"""
        message_lower = message.lower()

        # Đếm số lượng từ khóa cho mỗi intent
        search_count = sum(1 for word in AILanguageProcessor.SEARCH_SYNONYMS if word in message_lower)
        size_count = sum(1 for word in AILanguageProcessor.SIZE_SYNONYMS if word in message_lower)
        order_count = sum(1 for word in AILanguageProcessor.ORDER_SYNONYMS if word in message_lower)
        greeting_count = sum(1 for word in AILanguageProcessor.GREETING_SYNONYMS if word in message_lower)
        price_count = sum(1 for word in AILanguageProcessor.PRICE_SYNONYMS if word in message_lower)

        # Tìm intent có điểm cao nhất
        intent_scores = {
            'product_search': search_count,
            'size_help': size_count,
            'order_help': order_count,
            'greeting': greeting_count,
            'price_inquiry': price_count
        }

        max_score = max(intent_scores.values())
        if max_score == 0:
            return 'general'

        return max(intent_scores, key=intent_scores.get)

    @staticmethod
    def extract_entities(message: str) -> Dict:
        """Trích xuất các thực thể từ tin nhắn nâng cao"""
        entities = {
            'colors': [],
            'sizes': [],
            'brands': [],
            'categories': [],
            'price_range': None,
            'keywords': [],
            'gender': None,
            'style': []
        }

        message_lower = message.lower()

        # Trích xuất màu sắc nâng cao
        color_patterns = {
            'đỏ': ['đỏ', 'red', 'đỏ tươi', 'đỏ đậm'],
            'xanh': ['xanh', 'blue', 'xanh dương', 'xanh da trời', 'navy'],
            'xanh lá': ['xanh lá', 'green', 'xanh lục', 'xanh cây'],
            'vàng': ['vàng', 'yellow', 'gold'],
            'đen': ['đen', 'black', 'đen tuyền'],
            'trắng': ['trắng', 'white', 'trắng tinh'],
            'xám': ['xám', 'gray', 'grey', 'ghi'],
            'nâu': ['nâu', 'brown', 'nâu đất'],
            'hồng': ['hồng', 'pink', 'hồng phấn'],
            'tím': ['tím', 'purple', 'violet'],
            'cam': ['cam', 'orange'],
            'be': ['be', 'beige', 'kem']
        }

        for color, patterns in color_patterns.items():
            if any(pattern in message_lower for pattern in patterns):
                entities['colors'].append(color)

        # Trích xuất thương hiệu
        for brand, patterns in AILanguageProcessor.BRAND_KEYWORDS.items():
            if any(pattern in message_lower for pattern in patterns):
                entities['brands'].append(brand)

        # Trích xuất danh mục
        for category, patterns in AILanguageProcessor.CATEGORY_KEYWORDS.items():
            if any(pattern in message_lower for pattern in patterns):
                entities['categories'].append(category)

        # Trích xuất size nâng cao
        size_patterns = [
            r'size\s*([smlxl]+|\d+)',
            r'cỡ\s*([smlxl]+|\d+)',
            r'số\s*(\d+)',
            r'\b([smlxl]{1,3})\b',  # S, M, L, XL, XXL
            r'\b(3[6-9]|4[0-6])\b'  # Size giày 36-46
        ]

        for pattern in size_patterns:
            matches = re.findall(pattern, message_lower)
            for match in matches:
                if isinstance(match, tuple):
                    size = ''.join(match).upper()
                else:
                    size = match.upper()
                if size and size not in entities['sizes']:
                    entities['sizes'].append(size)

        # Trích xuất giới tính
        if any(word in message_lower for word in ['nam', 'men', 'boy', 'male']):
            entities['gender'] = 'nam'
        elif any(word in message_lower for word in ['nữ', 'women', 'girl', 'female']):
            entities['gender'] = 'nữ'
        elif any(word in message_lower for word in ['unisex', 'cả nam và nữ']):
            entities['gender'] = 'unisex'

        # Trích xuất style
        style_keywords = {
            'basic': ['basic', 'cơ bản', 'đơn giản'],
            'casual': ['casual', 'thường ngày', 'dạo phố'],
            'formal': ['formal', 'công sở', 'lịch sự'],
            'sport': ['sport', 'thể thao', 'gym', 'running'],
            'vintage': ['vintage', 'cổ điển', 'retro'],
            'streetwear': ['streetwear', 'đường phố', 'hip hop']
        }

        for style, patterns in style_keywords.items():
            if any(pattern in message_lower for pattern in patterns):
                entities['style'].append(style)

        # Trích xuất khoảng giá
        entities['price_range'] = AIProductSearchService.extract_price_range(message)

        # Trích xuất từ khóa chung (loại bỏ stop words)
        stop_words = ['tôi', 'bạn', 'có', 'không', 'là', 'của', 'và', 'với', 'trong', 'cho', 'về']
        words = message_lower.split()
        entities['keywords'] = [word for word in words if len(word) > 2 and word not in stop_words]

        return entities


class ProductSearchQueryBuilder:
    """Builder class để tạo query tìm kiếm sản phẩm"""

    def __init__(self):
        self.query = Q()
        self.filters = {}

    def add_text_search(self, keywords: List[str]):
        """Thêm tìm kiếm theo text"""
        if not keywords:
            return self

        text_query = Q()
        for keyword in keywords:
            if len(keyword) > 2:
                text_query |= (
                    Q(name__icontains=keyword) |
                    Q(description__icontains=keyword)
                )

        if text_query:
            self.query &= text_query
        return self

    def add_color_filter(self, colors: List[str]):
        """Thêm filter theo màu sắc"""
        if not colors:
            return self

        color_query = Q()
        for color in colors:
            color_query |= Q(productvariant__color__name__icontains=color)

        if color_query:
            self.query &= color_query
        return self

    def add_brand_filter(self, brands: List[str]):
        """Thêm filter theo thương hiệu"""
        if not brands:
            return self

        brand_query = Q()
        for brand in brands:
            brand_query |= Q(brand__name__icontains=brand)

        if brand_query:
            self.query &= brand_query
        return self

    def add_category_filter(self, categories: List[str]):
        """Thêm filter theo danh mục"""
        if not categories:
            return self

        category_query = Q()
        for category in categories:
            category_query |= Q(category__title__icontains=category)

        if category_query:
            self.query &= category_query
        return self

    def add_price_filter(self, price_range: Tuple[int, int]):
        """Thêm filter theo giá"""
        if not price_range:
            return self

        min_price, max_price = price_range
        self.query &= Q(price__gte=min_price, price__lte=max_price)
        return self

    def add_size_filter(self, sizes: List[str]):
        """Thêm filter theo size"""
        if not sizes:
            return self

        size_query = Q()
        for size in sizes:
            size_query |= Q(productvariant__size__name__icontains=size)

        if size_query:
            self.query &= size_query
        return self

    def add_gender_filter(self, gender: str):
        """Thêm filter theo giới tính"""
        if not gender:
            return self

        # Giả sử có field gender trong Product model
        # Hoặc có thể filter theo category/name
        if gender == 'nam':
            self.query &= (
                Q(name__icontains='nam') |
                Q(description__icontains='nam') |
                Q(category__title__icontains='nam')
            )
        elif gender == 'nữ':
            self.query &= (
                Q(name__icontains='nữ') |
                Q(description__icontains='nữ') |
                Q(category__title__icontains='nữ')
            )

        return self

    def build(self):
        """Trả về query đã build"""
        return self.query


class AIProductSearchService:
    """Service để tìm kiếm sản phẩm thông minh"""
    
    @staticmethod
    def search_products(query: str, user=None, limit: int = 10, entities: Dict = None) -> List[Product]:
        """Tìm kiếm sản phẩm dựa trên query và entities"""
        from api.models import Product

        # Extract entities nếu chưa có
        if not entities:
            entities = AILanguageProcessor.extract_entities(query)

        # Sử dụng QueryBuilder để tạo query
        builder = ProductSearchQueryBuilder()

        # Thêm text search
        builder.add_text_search(entities.get('keywords', []))

        # Thêm các filters
        builder.add_color_filter(entities.get('colors', []))
        builder.add_brand_filter(entities.get('brands', []))
        builder.add_category_filter(entities.get('categories', []))
        builder.add_size_filter(entities.get('sizes', []))
        builder.add_gender_filter(entities.get('gender'))

        if entities.get('price_range'):
            builder.add_price_filter(entities['price_range'])

        # Build query
        search_query = builder.build()

        # Nếu không có query cụ thể, tìm tất cả
        if not search_query:
            products = Product.objects.all()
        else:
            products = Product.objects.filter(search_query)

        # Apply user preferences
        if user and hasattr(user, 'ai_preferences'):
            prefs = user.ai_preferences
            if prefs.preferred_brands:
                pref_products = products.filter(brand__name__in=prefs.preferred_brands)
                other_products = products.exclude(brand__name__in=prefs.preferred_brands)
                products = list(pref_products) + list(other_products)
            if prefs.preferred_categories:
                pref_products = products.filter(category__title__in=prefs.preferred_categories)
                other_products = products.exclude(category__title__in=prefs.preferred_categories)
                products = list(pref_products) + list(other_products)

        return products.distinct()[:limit] if hasattr(products, 'distinct') else products[:limit]
    
    @staticmethod
    def extract_price_range(query: str) -> Optional[Tuple[int, int]]:
        """Trích xuất khoảng giá từ query"""
        # Tìm pattern như "dưới 500k", "từ 100k đến 300k", "khoảng 200k"
        patterns = [
            r'dưới\s+(\d+)k?',
            r'từ\s+(\d+)k?\s+đến\s+(\d+)k?',
            r'khoảng\s+(\d+)k?',
            r'(\d+)k?\s*-\s*(\d+)k?'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, query.lower())
            if match:
                groups = match.groups()
                if len(groups) == 1:
                    price = int(groups[0]) * 1000
                    if 'dưới' in pattern:
                        return (0, price)
                    else:
                        return (price - 50000, price + 50000)
                elif len(groups) == 2:
                    min_price = int(groups[0]) * 1000
                    max_price = int(groups[1]) * 1000
                    return (min_price, max_price)
        
        return None
    
    @staticmethod
    def extract_size_info(query: str) -> Optional[str]:
        """Trích xuất thông tin size từ query"""
        size_patterns = [
            r'size\s+([smlxl]+|\d+)',
            r'cỡ\s+([smlxl]+|\d+)',
            r'số\s+(\d+)'
        ]
        
        for pattern in size_patterns:
            match = re.search(pattern, query.lower())
            if match:
                return match.group(1).upper()
        
        return None


class AISizeRecommendationService:
    """Service để gợi ý size phù hợp"""
    
    @staticmethod
    def recommend_size(product: Product, user=None, user_info: Dict = None) -> Dict:
        """Gợi ý size cho sản phẩm"""
        recommendations = {
            'recommended_sizes': [],
            'explanation': '',
            'size_guide': {}
        }
        
        # Lấy thông tin size preferences của user
        if user and hasattr(user, 'ai_preferences'):
            size_prefs = user.ai_preferences.size_preferences
            category_key = product.category.title.lower()
            
            if category_key in size_prefs:
                recommended_size = size_prefs[category_key]
                recommendations['recommended_sizes'].append(recommended_size)
                recommendations['explanation'] = f"Dựa trên lịch sử mua hàng, bạn thường chọn size {recommended_size} cho {product.category.title}"
        
        # Lấy các size có sẵn cho sản phẩm
        if product.has_variants:
            available_sizes = ProductVariant.objects.filter(
                product=product, 
                stock_quantity__gt=0
            ).values_list('size__name', flat=True).distinct()
            
            recommendations['available_sizes'] = list(available_sizes)
        
        # Thêm size guide chung
        recommendations['size_guide'] = AISizeRecommendationService._get_size_guide(product.category.title)
        
        return recommendations
    
    @staticmethod
    def _get_size_guide(category: str) -> Dict:
        """Lấy hướng dẫn chọn size theo category"""
        size_guides = {
            'Áo': {
                'S': 'Ngực: 84-88cm, Eo: 74-78cm',
                'M': 'Ngực: 88-92cm, Eo: 78-82cm',
                'L': 'Ngực: 92-96cm, Eo: 82-86cm',
                'XL': 'Ngực: 96-100cm, Eo: 86-90cm'
            },
            'Quần': {
                'S': 'Eo: 68-72cm, Mông: 88-92cm',
                'M': 'Eo: 72-76cm, Mông: 92-96cm',
                'L': 'Eo: 76-80cm, Mông: 96-100cm',
                'XL': 'Eo: 80-84cm, Mông: 100-104cm'
            },
            'Giày': {
                '39': 'Dài chân: 24.5cm',
                '40': 'Dài chân: 25cm',
                '41': 'Dài chân: 25.5cm',
                '42': 'Dài chân: 26cm',
                '43': 'Dài chân: 26.5cm'
            }
        }
        
        return size_guides.get(category, {})


class ConversationContextManager:
    """Quản lý context của conversation"""

    def __init__(self):
        self.contexts = {}  # session_id -> context

    def get_context(self, session_id: str) -> Dict:
        """Lấy context của session"""
        return self.contexts.get(session_id, {
            'last_intent': None,
            'last_entities': {},
            'search_history': [],
            'preferences': {},
            'conversation_flow': []
        })

    def update_context(self, session_id: str, intent: str, entities: Dict, message: str):
        """Cập nhật context"""
        if session_id not in self.contexts:
            self.contexts[session_id] = {
                'last_intent': None,
                'last_entities': {},
                'search_history': [],
                'preferences': {},
                'conversation_flow': []
            }

        context = self.contexts[session_id]

        # Cập nhật intent và entities
        context['last_intent'] = intent
        context['last_entities'] = entities

        # Thêm vào conversation flow
        context['conversation_flow'].append({
            'message': message,
            'intent': intent,
            'entities': entities,
            'timestamp': timezone.now().isoformat()
        })

        # Giữ chỉ 10 tin nhắn gần nhất
        if len(context['conversation_flow']) > 10:
            context['conversation_flow'] = context['conversation_flow'][-10:]

        # Cập nhật search history cho product search
        if intent == 'product_search':
            context['search_history'].append({
                'query': message,
                'entities': entities,
                'timestamp': timezone.now().isoformat()
            })

            # Giữ chỉ 5 search gần nhất
            if len(context['search_history']) > 5:
                context['search_history'] = context['search_history'][-5:]

    def merge_entities_with_context(self, session_id: str, current_entities: Dict) -> Dict:
        """Merge entities hiện tại với context để xử lý follow-up questions"""
        context = self.get_context(session_id)
        last_entities = context.get('last_entities', {})

        merged = current_entities.copy()

        # Nếu tin nhắn hiện tại không có entities cụ thể,
        # sử dụng entities từ context
        for key in ['colors', 'brands', 'categories', 'sizes']:
            if not merged.get(key) and last_entities.get(key):
                merged[key] = last_entities[key]

        # Merge price range nếu chưa có
        if not merged.get('price_range') and last_entities.get('price_range'):
            merged['price_range'] = last_entities['price_range']

        return merged

    def is_follow_up_question(self, session_id: str, message: str) -> bool:
        """Kiểm tra có phải follow-up question không"""
        context = self.get_context(session_id)
        last_intent = context.get('last_intent')

        # Các từ khóa follow-up
        follow_up_keywords = [
            'còn', 'thêm', 'khác', 'nữa', 'other', 'more',
            'màu khác', 'size khác', 'giá khác', 'thương hiệu khác'
        ]

        message_lower = message.lower()

        # Nếu intent trước là product_search và có follow-up keywords
        if last_intent == 'product_search':
            if any(keyword in message_lower for keyword in follow_up_keywords):
                return True

            # Hoặc nếu tin nhắn ngắn và có entities
            if len(message.split()) <= 3:
                entities = AILanguageProcessor.extract_entities(message)
                if any(entities.get(key) for key in ['colors', 'brands', 'sizes', 'price_range']):
                    return True

        return False


# Global context manager instance
context_manager = ConversationContextManager()


class AIResponseGenerator:
    """Service để tạo phản hồi AI"""
    
    @staticmethod
    def generate_response(user_message: str, user=None, context: Dict = None, session_id: str = None) -> Dict:
        """Tạo phản hồi AI cho tin nhắn của user với context awareness"""
        response = {
            'message': '',
            'actions_taken': [],
            'suggested_products': [],
            'quick_replies': [],
            'metadata': {}
        }

        # Phân tích intent và entities
        intent = AILanguageProcessor.extract_intent(user_message)
        entities = AILanguageProcessor.extract_entities(user_message)

        # Sử dụng context manager nếu có session_id
        if session_id:
            # Kiểm tra follow-up question
            is_follow_up = context_manager.is_follow_up_question(session_id, user_message)

            if is_follow_up:
                # Merge entities với context
                entities = context_manager.merge_entities_with_context(session_id, entities)
                # Giữ intent là product_search cho follow-up
                if not intent or intent == 'general':
                    intent = 'product_search'

            # Cập nhật context
            context_manager.update_context(session_id, intent, entities, user_message)

        response['metadata']['intent'] = intent
        response['metadata']['entities'] = entities
        response['metadata']['is_follow_up'] = is_follow_up if session_id else False

        if intent == 'product_search':
            return AIResponseGenerator._handle_product_search(user_message, user, response, entities)
        elif intent == 'size_help':
            return AIResponseGenerator._handle_size_help(user_message, user, response, entities)
        elif intent == 'order_help':
            return AIResponseGenerator._handle_order_help(user_message, user, response, entities)
        elif intent == 'greeting':
            return AIResponseGenerator._handle_greeting(user_message, user, response)
        elif intent == 'price_inquiry':
            return AIResponseGenerator._handle_price_inquiry(user_message, user, response, entities)
        else:
            return AIResponseGenerator._handle_general(user_message, user, response)
    
    @staticmethod
    def _handle_product_search(message: str, user, response: Dict, entities: Dict) -> Dict:
        """Xử lý tìm kiếm sản phẩm với entities nâng cao"""
        # Sử dụng AIProductSearchService với entities
        products = AIProductSearchService.search_products(message, user, entities=entities)

        if products:
            # Serialize products
            from api.serializers import ProductSerializer
            products_data = ProductSerializer(products, many=True).data
            response['suggested_products'] = products_data

            # Tạo message thông minh với filter info
            filter_info = []

            if entities.get('colors'):
                filter_info.append(f"màu {', '.join(entities['colors'])}")

            if entities.get('brands'):
                filter_info.append(f"thương hiệu {', '.join(entities['brands'])}")

            if entities.get('categories'):
                filter_info.append(f"loại {', '.join(entities['categories'])}")

            if entities.get('sizes'):
                filter_info.append(f"size {', '.join(entities['sizes'])}")

            if entities.get('price_range'):
                min_p, max_p = entities['price_range']
                filter_info.append(f"giá {min_p//1000}k-{max_p//1000}k")

            if entities.get('gender'):
                filter_info.append(f"dành cho {entities['gender']}")

            filter_text = f" ({', '.join(filter_info)})" if filter_info else ""

            response['message'] = f"🛍️ Tôi tìm thấy **{len(products)} sản phẩm**{filter_text} phù hợp:\n\n"

            # Hiển thị 3 sản phẩm đầu trong text
            for i, product in enumerate(products_data[:3], 1):
                price = f"{int(product['price']):,}" if product.get('price') else "Liên hệ"
                response['message'] += f"{i}. **{product['name']}**\n"
                response['message'] += f"   💰 {price} VND\n"
                response['message'] += f"   👉 [Xem chi tiết & mua ngay](/#/products/{product['id']})\n\n"

            if len(products) > 3:
                response['message'] += f"...và **{len(products) - 3} sản phẩm khác** bên dưới!"

            # Smart quick replies dựa trên entities
            quick_replies = ['Xem chi tiết']

            if not entities.get('colors'):
                quick_replies.append('Lọc theo màu')
            if not entities.get('price_range'):
                quick_replies.append('Lọc theo giá')
            if not entities.get('brands'):
                quick_replies.append('Lọc theo thương hiệu')

            quick_replies.extend(['Hỗ trợ chọn size', 'Tìm sản phẩm khác'])

            response['quick_replies'] = quick_replies
            response['actions_taken'].append({
                'type': 'product_search',
                'query': message,
                'results_count': len(products),
                'filters_applied': entities
            })
        else:
            # Gợi ý dựa trên entities đã có
            suggestions = []
            if entities.get('colors'):
                suggestions.append(f"Thử tìm màu khác thay vì {', '.join(entities['colors'])}")
            if entities.get('price_range'):
                suggestions.append("Thử mở rộng khoảng giá")
            if entities.get('brands'):
                suggestions.append("Thử tìm thương hiệu khác")

            if not suggestions:
                suggestions = [
                    "Mô tả chi tiết hơn về sản phẩm",
                    "Tìm theo danh mục (áo, quần, giày...)",
                    "Xem sản phẩm hot hiện tại"
                ]

            response['message'] = f"Xin lỗi, tôi không tìm thấy sản phẩm nào phù hợp. Bạn có thể thử:\n\n"
            for i, suggestion in enumerate(suggestions, 1):
                response['message'] += f"• {suggestion}\n"

            response['quick_replies'] = ['Sản phẩm hot', 'Tìm theo danh mục', 'Thay đổi bộ lọc', 'Liên hệ hỗ trợ']

        return response
    
    @staticmethod
    def _handle_size_help(message: str, user, response: Dict, entities: Dict) -> Dict:
        """Xử lý hỗ trợ chọn size với entities"""
        if entities['sizes']:
            size = entities['sizes'][0]
            response['message'] = f"Bạn đang quan tâm đến size {size}. Tôi có thể giúp bạn kiểm tra size này có phù hợp không?"
        else:
            response['message'] = "Tôi có thể giúp bạn chọn size phù hợp! Bạn đang quan tâm đến loại sản phẩm nào?"

        response['quick_replies'] = ['Áo', 'Quần', 'Giày', 'Hướng dẫn đo size', 'Bảng size chi tiết']
        response['actions_taken'].append({
            'type': 'size_help',
            'query': message,
            'detected_sizes': entities['sizes']
        })
        return response
    
    @staticmethod
    def _handle_order_help(message: str, user, response: Dict, entities: Dict) -> Dict:
        """Xử lý hỗ trợ đặt hàng với entities"""
        response['message'] = "Tôi có thể hỗ trợ bạn đặt hàng! Bạn cần hỗ trợ gì?"
        response['quick_replies'] = ['Kiểm tra giỏ hàng', 'Hướng dẫn thanh toán', 'Theo dõi đơn hàng', 'Chính sách giao hàng']
        response['actions_taken'].append({
            'type': 'order_help',
            'query': message
        })
        return response
    
    @staticmethod
    def _handle_price_inquiry(message: str, user, response: Dict, entities: Dict) -> Dict:
        """Xử lý câu hỏi về giá"""
        if entities['price_range']:
            min_price, max_price = entities['price_range']
            products = Product.objects.filter(price__gte=min_price, price__lte=max_price)[:10]
            if products:
                response['suggested_products'] = products
                response['message'] = f"Đây là các sản phẩm trong khoảng giá {min_price:,} - {max_price:,} VND:"
            else:
                response['message'] = f"Hiện tại không có sản phẩm nào trong khoảng giá {min_price:,} - {max_price:,} VND."
        else:
            response['message'] = "Bạn muốn xem sản phẩm trong khoảng giá nào? Tôi có thể gợi ý cho bạn:"

        response['quick_replies'] = ['Dưới 200k', '200k - 500k', '500k - 1tr', 'Trên 1tr', 'Xem khuyến mãi']
        response['actions_taken'].append({
            'type': 'price_inquiry',
            'query': message,
            'price_range': entities['price_range']
        })
        return response
    
    @staticmethod
    def _handle_greeting(message: str, user, response: Dict) -> Dict:
        """Xử lý lời chào"""
        user_name = user.first_name if user and user.first_name else "bạn"
        response['message'] = f"Xin chào {user_name}! Tôi là trợ lý AI của shop. Tôi có thể giúp bạn tìm sản phẩm, chọn size, và hỗ trợ đặt hàng. Bạn cần hỗ trợ gì?"
        response['quick_replies'] = ['Tìm sản phẩm', 'Hỗ trợ chọn size', 'Kiểm tra đơn hàng', 'Xem khuyến mãi']
        return response
    
    @staticmethod
    def _handle_general(message: str, user, response: Dict) -> Dict:
        """Xử lý câu hỏi chung"""
        # Tìm trong knowledge base
        knowledge = AIKnowledgeBase.objects.filter(
            Q(question__icontains=message) | Q(keywords__contains=message.lower()),
            is_active=True
        ).first()
        
        if knowledge:
            response['message'] = knowledge.answer
        else:
            response['message'] = "Tôi chưa hiểu rõ câu hỏi của bạn. Bạn có thể hỏi tôi về sản phẩm, size, đặt hàng, hoặc chính sách của shop."
        
        response['quick_replies'] = ['Tìm sản phẩm', 'Hỗ trợ chọn size', 'Chính sách đổi trả', 'Liên hệ hỗ trợ']
        return response
