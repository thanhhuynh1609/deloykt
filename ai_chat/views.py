from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Count, Q
from django.core.paginator import Paginator
import uuid
import logging

from .models import AIConversation, AIMessage, AIAction, UserPreference, AIKnowledgeBase
from .serializers import (
    AIConversationSerializer, AIMessageSerializer, ChatRequestSerializer,
    ChatResponseSerializer, UserPreferenceSerializer, AIKnowledgeBaseSerializer
)
from .ai_service import AIResponseGenerator, AIProductSearchService, AISizeRecommendationService
from api.models import Product
from api.serializers import ProductSerializer

logger = logging.getLogger(__name__)


@api_view(['GET'])
def test_ai_endpoint(request):
    """Test endpoint để kiểm tra AI chat có hoạt động không - KHÔNG CẦN AUTH"""
    try:
        # Test import Product model
        from api.models import Product
        product_count = Product.objects.count()
        import_status = f"✅ Product model OK - {product_count} products"
    except Exception as e:
        import_status = f"❌ Product model error: {str(e)}"

    return Response({
        'status': 'success',
        'message': 'AI Chat endpoint is working!',
        'import_status': import_status,
        'user': request.user.username if request.user.is_authenticated else 'Anonymous'
    })


@api_view(['POST'])
def debug_ai_chat(request):
    """Debug endpoint để test AI chat - KHÔNG CẦN AUTH"""
    try:
        message = request.data.get('message', 'test')

        # Test import
        try:
            from api.models import Product
            product_count = Product.objects.count()
            import_status = f"✅ Product model imported. Found {product_count} products"
        except Exception as e:
            import_status = f"❌ Cannot import Product model: {str(e)}"

        # Test AI response
        try:
            chat_view = AIChatView()
            response = chat_view._generate_smart_response(message, 'test-session', request.user)
            ai_status = "✅ AI response generated successfully"
        except Exception as e:
            ai_status = f"❌ AI response error: {str(e)}"
            response = {"error": str(e)}

        return Response({
            'message': message,
            'import_status': import_status,
            'ai_status': ai_status,
            'ai_response': response,
            'user': request.user.username if request.user.is_authenticated else 'Anonymous'
        })

    except Exception as e:
        return Response({
            'error': f"Debug error: {str(e)}",
            'message': 'Debug endpoint failed'
        }, status=500)


@api_view(['POST'])
def test_product_search(request):
    """Test product search without authentication"""
    try:
        message = request.data.get('message', 'tìm áo')

        # Test Smart AI response generation
        from .smart_ai_service import smart_ai
        response = smart_ai.process_message(message, None)

        return Response({
            'status': 'success',
            'message': message,
            'ai_response': response,
            'timestamp': timezone.now()
        })

    except Exception as e:
        import traceback
        return Response({
            'status': 'error',
            'message': message if 'message' in locals() else 'unknown',
            'error': str(e),
            'traceback': traceback.format_exc(),
            'timestamp': timezone.now()
        }, status=500)


class AIChatView(APIView):
    """Main API endpoint cho AI chatbox"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Gửi tin nhắn đến AI và nhận phản hồi"""
        logger.info(f"AI Chat request from user: {request.user}")
        logger.info(f"Request data: {request.data}")

        serializer = ChatRequestSerializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Serializer validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user_message = serializer.validated_data['message']
        session_id = serializer.validated_data.get('session_id')
        context = serializer.validated_data.get('context', {})

        # Handle null or empty session_id
        if not session_id or session_id == 'null':
            session_id = None
        
        try:
            # Tạo session_id nếu chưa có
            if not session_id:
                session_id = str(uuid.uuid4())

            # Sử dụng Smart AI Service
            from .smart_ai_service import smart_ai
            ai_response = smart_ai.process_message(user_message, request.user)

            # Tạo response
            response_data = {
                'message': ai_response['message'],
                'session_id': session_id,
                'message_type': 'ai',
                'actions_taken': ai_response.get('actions_taken', []),
                'suggested_products': ai_response.get('suggested_products', []),
                'quick_replies': ai_response.get('quick_replies', []),
                'metadata': ai_response.get('metadata', {})
            }

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error in AI chat: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return Response(
                {'error': 'Có lỗi xảy ra khi xử lý tin nhắn. Vui lòng thử lại.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _generate_smart_response(self, message, session_id, user=None):
        """Tạo phản hồi AI thông minh với tìm kiếm sản phẩm thực"""
        try:
            message_lower = message.lower()

            # Phân tích intent và tìm kiếm sản phẩm
            if any(word in message_lower for word in ['tìm', 'search', 'sản phẩm', 'áo', 'quần', 'giày', 'mua', 'cần']):
                return self._handle_product_search_safe(message, message_lower)

            # Các intent khác giữ nguyên
            return self._generate_simple_response(message, session_id)
        except Exception as e:
            logger.error(f"Error in _generate_smart_response: {str(e)}")
            # Fallback to simple response
            return self._generate_simple_response(message, session_id)

    def _handle_product_search(self, message, message_lower):
        """Xử lý tìm kiếm sản phẩm thực"""
        from api.models import Product, Brand, Category
        from django.db.models import Q

        # Phân tích màu sắc
        colors = self._extract_colors(message_lower)

        # Phân tích khoảng giá
        price_range = self._extract_price_range(message_lower)

        # Tìm kiếm sản phẩm
        search_q = Q()
        keywords = message_lower.split()

        # Tìm theo từ khóa
        for keyword in keywords:
            if len(keyword) > 2 and keyword not in ['màu', 'color', 'giá', 'price', 'vnd', 'đồng']:
                search_q |= (
                    Q(name__icontains=keyword) |
                    Q(description__icontains=keyword) |
                    Q(brand__name__icontains=keyword) |
                    Q(category__title__icontains=keyword)
                )

        # Nếu không có từ khóa cụ thể, tìm theo category chung
        if not search_q:
            if any(word in message_lower for word in ['áo', 'shirt', 'top']):
                search_q = Q(category__title__icontains='áo')
            elif any(word in message_lower for word in ['quần', 'pants', 'jean']):
                search_q = Q(category__title__icontains='quần')
            elif any(word in message_lower for word in ['giày', 'shoes', 'sneaker']):
                search_q = Q(category__title__icontains='giày')
            else:
                search_q = Q()  # Tìm tất cả sản phẩm

        # Áp dụng filter
        products = Product.objects.all()

        if search_q:
            products = products.filter(search_q)

        # Filter theo màu sắc (nếu có variants)
        if colors:
            color_filter = Q()
            for color in colors:
                color_filter |= Q(productvariant__color__name__icontains=color)
            products = products.filter(color_filter)

        # Filter theo giá
        if price_range:
            min_price, max_price = price_range
            products = products.filter(price__gte=min_price, price__lte=max_price)

        # Lấy sản phẩm
        products = products.distinct()[:6]  # Lấy tối đa 6 sản phẩm

        if products:
            # Serialize sản phẩm
            from api.serializers import ProductSerializer
            products_data = ProductSerializer(products, many=True).data

            # Tạo message với link sản phẩm
            product_count = len(products)

            # Tạo thông tin filter
            filter_info = []
            if colors:
                filter_info.append(f"màu {', '.join(colors)}")
            if price_range:
                min_p, max_p = price_range
                filter_info.append(f"giá {min_p//1000}k-{max_p//1000}k")

            filter_text = f" ({', '.join(filter_info)})" if filter_info else ""

            message_text = f"🛍️ Tôi tìm thấy **{product_count} sản phẩm**{filter_text} phù hợp:\n\n"

            for i, product in enumerate(products_data[:3], 1):  # Hiển thị 3 sản phẩm đầu trong text
                price = f"{int(product['price']):,}" if product['price'] else "Liên hệ"
                message_text += f"{i}. **{product['name']}**\n"
                message_text += f"   💰 {price} VND\n"
                message_text += f"   👉 [Xem chi tiết & mua ngay](/#/products/{product['id']})\n\n"

            if product_count > 3:
                message_text += f"...và **{product_count - 3} sản phẩm khác** bên dưới. Click vào sản phẩm để xem chi tiết!"

            return {
                'message': message_text,
                'quick_replies': ['Xem chi tiết', 'Lọc theo giá', 'Tìm sản phẩm khác', 'Hỗ trợ chọn size'],
                'suggested_products': products_data,  # Gửi data sản phẩm để hiển thị cards
                'actions_taken': [{'type': 'product_search', 'query': message, 'results_count': product_count}],
                'metadata': {'intent': 'product_search', 'products_found': product_count}
            }
        else:
            return {
                'message': 'Xin lỗi, tôi không tìm thấy sản phẩm nào phù hợp với yêu cầu của bạn. Bạn có thể thử:\n\n• Mô tả chi tiết hơn về sản phẩm\n• Tìm theo danh mục (áo, quần, giày...)\n• Tìm theo thương hiệu\n• Xem các sản phẩm hot hiện tại',
                'quick_replies': ['Xem sản phẩm hot', 'Tìm theo danh mục', 'Tìm theo thương hiệu', 'Liên hệ hỗ trợ'],
                'actions_taken': [{'type': 'product_search', 'query': message, 'results_count': 0}],
                'metadata': {'intent': 'product_search', 'products_found': 0}
            }

    def _extract_colors(self, message_lower):
        """Trích xuất màu sắc từ tin nhắn"""
        colors = []
        color_keywords = {
            'đỏ': ['đỏ', 'red'],
            'xanh': ['xanh', 'blue', 'xanh dương', 'xanh da trời'],
            'xanh lá': ['xanh lá', 'green', 'xanh lục'],
            'vàng': ['vàng', 'yellow'],
            'đen': ['đen', 'black'],
            'trắng': ['trắng', 'white'],
            'xám': ['xám', 'gray', 'grey'],
            'nâu': ['nâu', 'brown'],
            'hồng': ['hồng', 'pink'],
            'tím': ['tím', 'purple'],
            'cam': ['cam', 'orange']
        }

        for color, keywords in color_keywords.items():
            if any(keyword in message_lower for keyword in keywords):
                colors.append(color)

        return colors

    def _extract_price_range(self, message_lower):
        """Trích xuất khoảng giá từ tin nhắn"""
        import re

        # Pattern cho các cách nói về giá
        patterns = [
            r'dưới\s+(\d+)k?',
            r'từ\s+(\d+)k?\s+đến\s+(\d+)k?',
            r'khoảng\s+(\d+)k?',
            r'(\d+)k?\s*-\s*(\d+)k?',
            r'rẻ',  # Giá rẻ
            r'đắt'  # Giá đắt
        ]

        for pattern in patterns:
            match = re.search(pattern, message_lower)
            if match:
                if pattern == r'rẻ':
                    return (0, 500000)  # Dưới 500k
                elif pattern == r'đắt':
                    return (1000000, 10000000)  # Trên 1 triệu

                groups = match.groups()
                if len(groups) == 1:
                    price = int(groups[0]) * 1000
                    if 'dưới' in pattern:
                        return (0, price)
                    else:
                        return (price - 100000, price + 100000)
                elif len(groups) == 2:
                    min_price = int(groups[0]) * 1000
                    max_price = int(groups[1]) * 1000
                    return (min_price, max_price)

        return None

    def _handle_product_search_safe(self, message, message_lower):
        """Xử lý tìm kiếm sản phẩm an toàn với fallback"""
        try:
            # Import trong try block để tránh lỗi
            from api.models import Product
            from django.db.models import Q

            # Tìm kiếm đơn giản
            keywords = [word for word in message_lower.split() if len(word) > 2]

            if not keywords:
                return self._no_products_found_response(message)

            # Tạo query đơn giản
            search_q = Q()
            for keyword in keywords[:3]:  # Chỉ lấy 3 từ khóa đầu
                if keyword not in ['tìm', 'search', 'màu', 'color']:
                    search_q |= Q(name__icontains=keyword)

            # Tìm sản phẩm
            products = Product.objects.filter(search_q).distinct()[:5]

            if products.exists():
                return self._format_products_response(products, message)
            else:
                return self._no_products_found_response(message)

        except ImportError:
            logger.error("Cannot import Product model")
            return self._fallback_product_response(message)
        except Exception as e:
            logger.error(f"Error in product search: {str(e)}")
            return self._fallback_product_response(message)

    def _format_products_response(self, products, original_message):
        """Format response với sản phẩm tìm được"""
        try:
            from api.serializers import ProductSerializer
            products_data = ProductSerializer(products, many=True).data

            product_count = len(products_data)
            message_text = f"🛍️ Tôi tìm thấy **{product_count} sản phẩm** phù hợp:\n\n"

            for i, product in enumerate(products_data[:3], 1):
                price = f"{int(product['price']):,}" if product.get('price') else "Liên hệ"
                message_text += f"{i}. **{product['name']}**\n"
                message_text += f"   💰 {price} VND\n"
                message_text += f"   👉 [Xem chi tiết](/#/products/{product['id']})\n\n"

            if product_count > 3:
                message_text += f"...và **{product_count - 3} sản phẩm khác** bên dưới!"

            return {
                'message': message_text,
                'quick_replies': ['Xem chi tiết', 'Lọc theo giá', 'Tìm sản phẩm khác'],
                'suggested_products': products_data,
                'actions_taken': [{'type': 'product_search', 'query': original_message, 'results_count': product_count}],
                'metadata': {'intent': 'product_search', 'products_found': product_count}
            }
        except Exception as e:
            logger.error(f"Error formatting products: {str(e)}")
            return self._fallback_product_response(original_message)

    def _no_products_found_response(self, message):
        """Response khi không tìm thấy sản phẩm"""
        return {
            'message': 'Xin lỗi, tôi không tìm thấy sản phẩm nào phù hợp. Bạn có thể thử:\n\n• Mô tả chi tiết hơn\n• Tìm theo danh mục\n• Xem sản phẩm hot',
            'quick_replies': ['Sản phẩm hot', 'Áo', 'Quần', 'Giày'],
            'actions_taken': [{'type': 'product_search', 'query': message, 'results_count': 0}],
            'metadata': {'intent': 'product_search', 'products_found': 0}
        }

    def _fallback_product_response(self, message):
        """Fallback response khi có lỗi"""
        return {
            'message': 'Tôi có thể giúp bạn tìm sản phẩm! Hiện tại hệ thống đang cập nhật, bạn có thể:\n\n• Xem danh mục sản phẩm\n• Liên hệ hỗ trợ\n• Thử lại sau',
            'quick_replies': ['Danh mục sản phẩm', 'Liên hệ hỗ trợ', 'Thử lại'],
            'actions_taken': [{'type': 'product_search_error', 'query': message}],
            'metadata': {'intent': 'product_search', 'error': True}
        }

    def _generate_database_response(self, message, session_id, user, context):
        """Tạo phản hồi AI với tìm kiếm database thực"""
        try:
            message_lower = message.lower()

            # Detect intent
            intent = self._detect_intent(message_lower)

            if intent == 'product_search':
                return self._handle_database_product_search(message, message_lower, user)
            elif intent == 'greeting':
                return self._handle_greeting_response(message)
            elif intent == 'size_help':
                return self._handle_size_help_response(message)
            else:
                return self._handle_general_response(message)

        except Exception as e:
            logger.error(f"Error in database response: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return self._generate_fallback_response(message, session_id)

    def _detect_intent(self, message_lower):
        """Detect intent từ message"""
        if any(word in message_lower for word in ['tìm', 'search', 'sản phẩm', 'áo', 'quần', 'giày', 'mua', 'cần', 'có', 'bán']):
            return 'product_search'
        elif any(word in message_lower for word in ['xin chào', 'hello', 'hi', 'chào']):
            return 'greeting'
        elif any(word in message_lower for word in ['size', 'cỡ', 'số', 'kích thước']):
            return 'size_help'
        else:
            return 'general'

    def _handle_database_product_search(self, message, message_lower, user):
        """Xử lý tìm kiếm sản phẩm từ database thực"""
        try:
            from api.models import Product, Brand, Category
            from django.db.models import Q
            from api.serializers import ProductSerializer

            # Extract entities từ database
            entities = self._extract_entities_from_database(message_lower)

            # Build query
            query = Q()

            # Tìm theo keywords
            keywords = [word for word in message_lower.split() if len(word) > 2]
            for keyword in keywords:
                if keyword not in ['tìm', 'có', 'bán', 'shop', 'màu', 'size', 'cỡ']:
                    query |= (
                        Q(name__icontains=keyword) |
                        Q(description__icontains=keyword)
                    )

            # Filter theo màu sắc
            if entities['colors']:
                color_query = Q()
                for color in entities['colors']:
                    # Tìm trong tên sản phẩm hoặc variants
                    color_query |= Q(name__icontains=color)
                    try:
                        color_query |= Q(productvariant__color__name__icontains=color)
                    except:
                        pass  # Nếu không có ProductVariant model
                query &= color_query

            # Filter theo thương hiệu
            if entities['brands']:
                brand_query = Q()
                for brand in entities['brands']:
                    try:
                        brand_query |= Q(brand__name__icontains=brand)
                    except:
                        # Fallback: tìm trong tên sản phẩm
                        brand_query |= Q(name__icontains=brand)
                query &= brand_query

            # Filter theo category
            if entities['categories']:
                cat_query = Q()
                for category in entities['categories']:
                    try:
                        cat_query |= Q(category__title__icontains=category)
                    except:
                        # Fallback: tìm trong tên sản phẩm
                        cat_query |= Q(name__icontains=category)
                query &= cat_query

            # Filter theo giá
            if entities['price_range']:
                min_price, max_price = entities['price_range']
                query &= Q(price__gte=min_price, price__lte=max_price)

            # Tìm sản phẩm
            if query:
                products = Product.objects.filter(query).distinct()[:6]
            else:
                # Nếu không có query cụ thể, lấy sản phẩm mới nhất
                products = Product.objects.all().order_by('-id')[:6]

            if products.exists():
                # Serialize products
                products_data = ProductSerializer(products, many=True).data

                # Tạo response message
                filter_info = []
                if entities['colors']:
                    filter_info.append(f"màu {', '.join(entities['colors'])}")
                if entities['brands']:
                    filter_info.append(f"thương hiệu {', '.join(entities['brands'])}")
                if entities['categories']:
                    filter_info.append(f"loại {', '.join(entities['categories'])}")
                if entities['price_range']:
                    min_p, max_p = entities['price_range']
                    filter_info.append(f"giá {min_p//1000}k-{max_p//1000}k")

                filter_text = f" ({', '.join(filter_info)})" if filter_info else ""

                message_text = f"🛍️ Tôi tìm thấy **{len(products)} sản phẩm**{filter_text} phù hợp:\n\n"

                # Hiển thị 3 sản phẩm đầu
                for i, product in enumerate(products_data[:3], 1):
                    price = f"{int(product['price']):,}" if product.get('price') else "Liên hệ"
                    message_text += f"{i}. **{product['name']}**\n"
                    message_text += f"   💰 {price} VND\n"
                    message_text += f"   👉 [Xem chi tiết & mua ngay](/#/products/{product['id']})\n\n"

                if len(products) > 3:
                    message_text += f"...và **{len(products) - 3} sản phẩm khác** bên dưới!"

                return {
                    'message': message_text,
                    'suggested_products': products_data,
                    'quick_replies': ['Xem chi tiết', 'Lọc theo giá', 'Tìm sản phẩm khác', 'Hỗ trợ chọn size'],
                    'actions_taken': [{'type': 'product_search', 'query': message, 'results_count': len(products)}],
                    'metadata': {'intent': 'product_search', 'entities': entities, 'products_found': len(products)}
                }
            else:
                return {
                    'message': 'Xin lỗi, tôi không tìm thấy sản phẩm nào phù hợp. Bạn có thể thử:\n\n• Mô tả chi tiết hơn\n• Tìm theo danh mục\n• Xem sản phẩm hot',
                    'quick_replies': ['Sản phẩm hot', 'Áo', 'Quần', 'Giày', 'Liên hệ hỗ trợ'],
                    'actions_taken': [{'type': 'product_search', 'query': message, 'results_count': 0}],
                    'metadata': {'intent': 'product_search', 'entities': entities, 'products_found': 0}
                }

        except Exception as e:
            logger.error(f"Error in database product search: {str(e)}")
            return self._generate_fallback_response(message, 'fallback')

    def _extract_entities_from_database(self, message_lower):
        """Extract entities và validate với database"""
        entities = {
            'colors': [],
            'brands': [],
            'categories': [],
            'sizes': [],
            'price_range': None
        }

        # Extract màu sắc
        color_keywords = {
            'đỏ': ['đỏ', 'red'],
            'xanh': ['xanh', 'blue', 'xanh dương', 'navy'],
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

        for color, keywords in color_keywords.items():
            if any(keyword in message_lower for keyword in keywords):
                entities['colors'].append(color)

        # Extract thương hiệu từ database
        try:
            from api.models import Brand
            brands = Brand.objects.all()
            for brand in brands:
                if brand.name.lower() in message_lower:
                    entities['brands'].append(brand.name)
        except:
            # Fallback: hardcoded brands
            brand_keywords = ['nike', 'adidas', 'zara', 'h&m', 'uniqlo', 'gucci', 'puma', 'converse']
            for brand in brand_keywords:
                if brand in message_lower:
                    entities['brands'].append(brand)

        # Extract categories từ database
        try:
            from api.models import Category
            categories = Category.objects.all()
            for category in categories:
                if category.title.lower() in message_lower:
                    entities['categories'].append(category.title)
        except:
            # Fallback: hardcoded categories
            if any(word in message_lower for word in ['áo', 'shirt', 'top']):
                entities['categories'].append('áo')
            if any(word in message_lower for word in ['quần', 'pants', 'jean']):
                entities['categories'].append('quần')
            if any(word in message_lower for word in ['giày', 'shoes', 'sneaker']):
                entities['categories'].append('giày')

        # Extract sizes
        import re
        size_patterns = [
            r'size\s*([smlxl]+|\d+)',
            r'cỡ\s*([smlxl]+|\d+)',
            r'số\s*(\d+)',
            r'\b([smlxl]{1,3})\b'
        ]

        for pattern in size_patterns:
            matches = re.findall(pattern, message_lower)
            for match in matches:
                size = match.upper() if isinstance(match, str) else str(match).upper()
                if size and size not in entities['sizes']:
                    entities['sizes'].append(size)

        # Extract price range
        entities['price_range'] = self._extract_price_range(message_lower)

        return entities

    def _extract_price_range(self, message_lower):
        """Extract price range từ message"""
        import re

        patterns = [
            r'dưới\s+(\d+)k?',
            r'từ\s+(\d+)k?\s+đến\s+(\d+)k?',
            r'khoảng\s+(\d+)k?',
            r'(\d+)k?\s*-\s*(\d+)k?',
            r'rẻ',
            r'đắt'
        ]

        for pattern in patterns:
            match = re.search(pattern, message_lower)
            if match:
                if pattern == r'rẻ':
                    return (0, 500000)
                elif pattern == r'đắt':
                    return (1000000, 10000000)

                groups = match.groups()
                if len(groups) == 1:
                    price = int(groups[0]) * 1000
                    if 'dưới' in pattern:
                        return (0, price)
                    else:
                        return (price - 100000, price + 100000)
                elif len(groups) == 2:
                    min_price = int(groups[0]) * 1000
                    max_price = int(groups[1]) * 1000
                    return (min_price, max_price)

        return None

    def _handle_greeting_response(self, message):
        """Xử lý lời chào"""
        return {
            'message': 'Xin chào! Tôi là trợ lý AI của shop. Tôi có thể giúp bạn tìm sản phẩm, chọn size, và hỗ trợ đặt hàng. Bạn cần hỗ trợ gì?',
            'quick_replies': ['Tìm sản phẩm', 'Hỗ trợ chọn size', 'Kiểm tra đơn hàng', 'Xem khuyến mãi'],
            'actions_taken': [{'type': 'greeting', 'message': message}],
            'metadata': {'intent': 'greeting'}
        }

    def _handle_size_help_response(self, message):
        """Xử lý hỗ trợ size"""
        return {
            'message': 'Tôi có thể hỗ trợ bạn chọn size phù hợp! Bạn đang quan tâm đến sản phẩm nào? Tôi sẽ cung cấp bảng size chi tiết và hướng dẫn đo size.',
            'quick_replies': ['Size áo', 'Size quần', 'Size giày', 'Hướng dẫn đo'],
            'actions_taken': [{'type': 'size_help', 'query': message}],
            'metadata': {'intent': 'size_help'}
        }

    def _handle_general_response(self, message):
        """Xử lý câu hỏi chung"""
        return {
            'message': 'Cảm ơn bạn đã liên hệ! Tôi có thể giúp bạn tìm sản phẩm, chọn size, hỗ trợ đặt hàng, và trả lời các câu hỏi về shop. Bạn cần hỗ trợ gì cụ thể?',
            'quick_replies': ['Tìm sản phẩm', 'Hỗ trợ chọn size', 'Hướng dẫn đặt hàng', 'Liên hệ hỗ trợ'],
            'actions_taken': [{'type': 'general_help', 'query': message}],
            'metadata': {'intent': 'general'}
        }

    def _generate_fallback_response(self, message, session_id):
        """Fallback response khi có lỗi"""
        return {
            'message': 'Xin chào! Tôi là trợ lý AI của shop. Hiện tại hệ thống đang cập nhật một số tính năng. Bạn có thể:\n\n• Xem sản phẩm trên website\n• Liên hệ hỗ trợ trực tiếp\n• Thử lại sau',
            'quick_replies': ['Xem sản phẩm', 'Liên hệ hỗ trợ', 'Thử lại'],
            'actions_taken': [{'type': 'fallback', 'message': message}],
            'metadata': {'intent': 'fallback', 'session_id': session_id}
        }

    def _generate_simple_response(self, message, session_id):
        """Tạo phản hồi AI đơn giản không cần database"""
        message_lower = message.lower()

        # Phản hồi dựa trên từ khóa
        if any(word in message_lower for word in ['xin chào', 'hello', 'hi', 'chào']):
            return {
                'message': f'Xin chào! Tôi là trợ lý AI của shop. Tôi có thể giúp bạn tìm sản phẩm, chọn size, và hỗ trợ đặt hàng. Bạn cần hỗ trợ gì?',
                'quick_replies': ['Tìm sản phẩm', 'Hỗ trợ chọn size', 'Kiểm tra đơn hàng', 'Xem khuyến mãi'],
                'actions_taken': [{'type': 'greeting', 'message': message}],
                'metadata': {'intent': 'greeting'}
            }

        elif any(word in message_lower for word in ['tìm', 'search', 'sản phẩm', 'áo', 'quần', 'giày']):
            return {
                'message': 'Tôi có thể giúp bạn tìm sản phẩm! Bạn đang tìm loại sản phẩm nào? Hãy mô tả chi tiết hơn về màu sắc, kích thước, hoặc giá cả mong muốn.',
                'quick_replies': ['Áo thun', 'Quần jean', 'Giày sneaker', 'Phụ kiện'],
                'actions_taken': [{'type': 'product_search', 'query': message}],
                'metadata': {'intent': 'product_search'}
            }

        elif any(word in message_lower for word in ['size', 'cỡ', 'số', 'kích thước']):
            return {
                'message': 'Tôi có thể hỗ trợ bạn chọn size phù hợp! Bạn đang quan tâm đến sản phẩm nào? Tôi sẽ cung cấp bảng size chi tiết và hướng dẫn đo size.',
                'quick_replies': ['Size áo', 'Size quần', 'Size giày', 'Hướng dẫn đo'],
                'actions_taken': [{'type': 'size_help', 'query': message}],
                'metadata': {'intent': 'size_help'}
            }

        elif any(word in message_lower for word in ['khuyến mãi', 'sale', 'giảm giá', 'ưu đãi']):
            return {
                'message': 'Hiện tại chúng tôi có nhiều chương trình khuyến mãi hấp dẫn! Giảm giá lên đến 50% cho các sản phẩm thời trang. Bạn có thể xem thêm tại trang chủ hoặc đăng ký nhận thông báo.',
                'quick_replies': ['Xem khuyến mãi', 'Đăng ký nhận tin', 'Sản phẩm sale', 'Mã giảm giá'],
                'actions_taken': [{'type': 'promotion_inquiry', 'query': message}],
                'metadata': {'intent': 'promotion'}
            }

        elif any(word in message_lower for word in ['đặt hàng', 'order', 'mua', 'thanh toán']):
            return {
                'message': 'Tôi có thể hướng dẫn bạn đặt hàng! Quy trình rất đơn giản: Chọn sản phẩm → Thêm vào giỏ → Điền thông tin → Thanh toán. Bạn cần hỗ trợ bước nào?',
                'quick_replies': ['Hướng dẫn đặt hàng', 'Phương thức thanh toán', 'Kiểm tra giỏ hàng', 'Theo dõi đơn'],
                'actions_taken': [{'type': 'order_help', 'query': message}],
                'metadata': {'intent': 'order_help'}
            }

        else:
            return {
                'message': 'Cảm ơn bạn đã liên hệ! Tôi có thể giúp bạn tìm sản phẩm, chọn size, hỗ trợ đặt hàng, và trả lời các câu hỏi về shop. Bạn cần hỗ trợ gì cụ thể?',
                'quick_replies': ['Tìm sản phẩm', 'Hỗ trợ chọn size', 'Hướng dẫn đặt hàng', 'Liên hệ hỗ trợ'],
                'actions_taken': [{'type': 'general_help', 'query': message}],
                'metadata': {'intent': 'general'}
            }


class ConversationHistoryView(APIView):
    """Lấy lịch sử hội thoại"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, session_id=None):
        """Lấy lịch sử hội thoại theo session_id hoặc tất cả conversations của user"""
        if session_id:
            conversation = get_object_or_404(AIConversation, session_id=session_id, user=request.user)
            serializer = AIConversationSerializer(conversation)
            return Response(serializer.data)
        else:
            conversations = AIConversation.objects.filter(user=request.user)[:10]
            serializer = AIConversationSerializer(conversations, many=True)
            return Response(serializer.data)


class ProductRecommendationView(APIView):
    """API để lấy gợi ý sản phẩm"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Lấy gợi ý sản phẩm dựa trên query"""
        query = request.data.get('query', '')
        limit = request.data.get('limit', 10)
        
        if not query:
            return Response({'error': 'Query is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            products = AIProductSearchService.search_products(query, request.user, limit)
            serializer = ProductSerializer(products, many=True)
            return Response({
                'products': serializer.data,
                'count': len(products),
                'query': query
            })
        except Exception as e:
            logger.error(f"Error in product recommendation: {str(e)}")
            return Response(
                {'error': 'Có lỗi xảy ra khi tìm kiếm sản phẩm'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SizeRecommendationView(APIView):
    """API để lấy gợi ý size"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Lấy gợi ý size cho sản phẩm"""
        product_id = request.data.get('product_id')
        user_info = request.data.get('user_info', {})
        
        if not product_id:
            return Response({'error': 'Product ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            product = get_object_or_404(Product, id=product_id)
            recommendations = AISizeRecommendationService.recommend_size(
                product, 
                request.user, 
                user_info
            )
            return Response(recommendations)
        except Exception as e:
            logger.error(f"Error in size recommendation: {str(e)}")
            return Response(
                {'error': 'Có lỗi xảy ra khi gợi ý size'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserPreferenceView(APIView):
    """API để quản lý sở thích user"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Lấy sở thích của user"""
        try:
            preference = UserPreference.objects.get(user=request.user)
            serializer = UserPreferenceSerializer(preference)
            return Response(serializer.data)
        except UserPreference.DoesNotExist:
            return Response({
                'preferred_brands': [],
                'preferred_categories': [],
                'size_preferences': {},
                'price_range': {},
                'style_preferences': []
            })
    
    def post(self, request):
        """Cập nhật sở thích của user"""
        try:
            preference, created = UserPreference.objects.get_or_create(user=request.user)
            serializer = UserPreferenceSerializer(preference, data=request.data, partial=True)
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error updating user preferences: {str(e)}")
            return Response(
                {'error': 'Có lỗi xảy ra khi cập nhật sở thích'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def quick_action(request):
    """Xử lý các quick actions từ chatbox"""
    action_type = request.data.get('action_type')
    parameters = request.data.get('parameters', {})
    
    try:
        if action_type == 'view_product':
            product_id = parameters.get('product_id')
            product = get_object_or_404(Product, id=product_id)
            serializer = ProductSerializer(product)
            return Response({
                'action': 'view_product',
                'product': serializer.data
            })
        
        elif action_type == 'add_to_cart':
            # Logic thêm vào giỏ hàng
            return Response({
                'action': 'add_to_cart',
                'message': 'Đã thêm sản phẩm vào giỏ hàng'
            })
        
        elif action_type == 'check_stock':
            product_id = parameters.get('product_id')
            color_id = parameters.get('color_id')
            size_id = parameters.get('size_id')
            
            # Logic kiểm tra tồn kho
            return Response({
                'action': 'check_stock',
                'in_stock': True,
                'quantity': 10
            })
        
        else:
            return Response(
                {'error': 'Unknown action type'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except Exception as e:
        logger.error(f"Error in quick action: {str(e)}")
        return Response(
            {'error': 'Có lỗi xảy ra khi thực hiện action'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Admin Views
class AdminChatStatsView(APIView):
    """API để lấy thống kê chat cho admin"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        """Lấy thống kê tổng quan"""
        try:
            # Thống kê cơ bản
            total_conversations = AIConversation.objects.count()
            total_messages = AIMessage.objects.count()
            active_conversations = AIConversation.objects.filter(is_active=True).count()

            # Thống kê theo ngày (7 ngày gần nhất)
            from datetime import datetime, timedelta
            last_7_days = datetime.now() - timedelta(days=7)

            daily_stats = []
            for i in range(7):
                date = last_7_days + timedelta(days=i)
                conversations_count = AIConversation.objects.filter(
                    created_at__date=date.date()
                ).count()
                messages_count = AIMessage.objects.filter(
                    timestamp__date=date.date()
                ).count()

                daily_stats.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'conversations': conversations_count,
                    'messages': messages_count
                })

            # Top actions
            top_actions = AIAction.objects.values('action_type').annotate(
                count=Count('id')
            ).order_by('-count')[:5]

            return Response({
                'total_conversations': total_conversations,
                'total_messages': total_messages,
                'active_conversations': active_conversations,
                'daily_stats': daily_stats,
                'top_actions': list(top_actions)
            })

        except Exception as e:
            logger.error(f"Error getting chat stats: {str(e)}")
            return Response(
                {'error': 'Có lỗi xảy ra khi lấy thống kê'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminConversationListView(APIView):
    """API để lấy danh sách conversations cho admin"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        """Lấy danh sách conversations với phân trang"""
        try:
            page = int(request.GET.get('page', 1))
            page_size = int(request.GET.get('page_size', 20))
            search = request.GET.get('search', '')

            conversations = AIConversation.objects.select_related('user').order_by('-updated_at')

            if search:
                conversations = conversations.filter(
                    Q(user__username__icontains=search) |
                    Q(user__email__icontains=search) |
                    Q(session_id__icontains=search)
                )

            paginator = Paginator(conversations, page_size)
            page_obj = paginator.get_page(page)

            serializer = AIConversationSerializer(page_obj.object_list, many=True)

            return Response({
                'conversations': serializer.data,
                'total_pages': paginator.num_pages,
                'current_page': page,
                'total_count': paginator.count
            })

        except Exception as e:
            logger.error(f"Error getting conversations: {str(e)}")
            return Response(
                {'error': 'Có lỗi xảy ra khi lấy danh sách conversations'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminKnowledgeBaseView(APIView):
    """API để quản lý knowledge base"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        """Lấy danh sách knowledge base"""
        try:
            knowledge_type = request.GET.get('type', '')
            search = request.GET.get('search', '')

            knowledge = AIKnowledgeBase.objects.all().order_by('-created_at')

            if knowledge_type:
                knowledge = knowledge.filter(knowledge_type=knowledge_type)

            if search:
                knowledge = knowledge.filter(
                    Q(question__icontains=search) |
                    Q(answer__icontains=search)
                )

            serializer = AIKnowledgeBaseSerializer(knowledge, many=True)
            return Response(serializer.data)

        except Exception as e:
            logger.error(f"Error getting knowledge base: {str(e)}")
            return Response(
                {'error': 'Có lỗi xảy ra khi lấy knowledge base'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):
        """Tạo knowledge base mới"""
        try:
            serializer = AIKnowledgeBaseSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Error creating knowledge base: {str(e)}")
            return Response(
                {'error': 'Có lỗi xảy ra khi tạo knowledge base'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminKnowledgeBaseDetailView(APIView):
    """API để quản lý chi tiết knowledge base"""
    permission_classes = [IsAdminUser]

    def put(self, request, pk):
        """Cập nhật knowledge base"""
        try:
            knowledge = get_object_or_404(AIKnowledgeBase, pk=pk)
            serializer = AIKnowledgeBaseSerializer(knowledge, data=request.data, partial=True)

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Error updating knowledge base: {str(e)}")
            return Response(
                {'error': 'Có lỗi xảy ra khi cập nhật knowledge base'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def delete(self, request, pk):
        """Xóa knowledge base"""
        try:
            knowledge = get_object_or_404(AIKnowledgeBase, pk=pk)
            knowledge.delete()
            return Response({'message': 'Đã xóa thành công'})

        except Exception as e:
            logger.error(f"Error deleting knowledge base: {str(e)}")
            return Response(
                {'error': 'Có lỗi xảy ra khi xóa knowledge base'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
