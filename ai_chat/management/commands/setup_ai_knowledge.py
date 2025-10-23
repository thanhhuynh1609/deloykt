from django.core.management.base import BaseCommand
from ai_chat.models import AIKnowledgeBase


class Command(BaseCommand):
    help = 'Setup initial AI knowledge base data'

    def handle(self, *args, **options):
        self.stdout.write('Setting up AI knowledge base...')
        
        # FAQ Knowledge
        faq_data = [
            {
                'knowledge_type': 'faq',
                'question': 'Làm thế nào để đặt hàng?',
                'answer': 'Bạn có thể đặt hàng bằng cách: 1) Chọn sản phẩm và thêm vào giỏ hàng, 2) Vào giỏ hàng và kiểm tra, 3) Điền thông tin giao hàng, 4) Chọn phương thức thanh toán và hoàn tất đơn hàng.',
                'keywords': ['đặt hàng', 'order', 'mua', 'thanh toán']
            },
            {
                'knowledge_type': 'faq',
                'question': 'Chính sách đổi trả như thế nào?',
                'answer': 'Chúng tôi hỗ trợ đổi trả trong vòng 7 ngày kể từ khi nhận hàng. Sản phẩm phải còn nguyên tem mác, chưa qua sử dụng. Vui lòng liên hệ bộ phận chăm sóc khách hàng để được hỗ trợ.',
                'keywords': ['đổi trả', 'return', 'refund', 'hoàn tiền']
            },
            {
                'knowledge_type': 'faq',
                'question': 'Thời gian giao hàng bao lâu?',
                'answer': 'Thời gian giao hàng thông thường là 2-3 ngày làm việc trong nội thành và 3-5 ngày làm việc cho các tỉnh thành khác. Đơn hàng gấp có thể được giao trong ngày với phí phụ thu.',
                'keywords': ['giao hàng', 'shipping', 'delivery', 'thời gian']
            }
        ]

        # Product Info Knowledge
        product_info_data = [
            {
                'knowledge_type': 'product_info',
                'question': 'Sản phẩm có bảo hành không?',
                'answer': 'Tất cả sản phẩm của chúng tôi đều có bảo hành chất lượng. Thời gian bảo hành tùy thuộc vào từng loại sản phẩm, thông thường từ 6 tháng đến 1 năm.',
                'keywords': ['bảo hành', 'warranty', 'chất lượng']
            },
            {
                'knowledge_type': 'product_info',
                'question': 'Làm thế nào để kiểm tra tồn kho?',
                'answer': 'Bạn có thể kiểm tra tồn kho bằng cách xem thông tin trên trang sản phẩm. Nếu sản phẩm hết hàng, hệ thống sẽ hiển thị "Hết hàng" và bạn có thể đăng ký nhận thông báo khi có hàng trở lại.',
                'keywords': ['tồn kho', 'stock', 'hết hàng', 'có hàng']
            }
        ]

        # Size Guide Knowledge
        size_guide_data = [
            {
                'knowledge_type': 'size_guide',
                'question': 'Cách chọn size áo phù hợp?',
                'answer': 'Để chọn size áo phù hợp: Size S (84-88cm ngực), Size M (88-92cm ngực), Size L (92-96cm ngực), Size XL (96-100cm ngực). Bạn nên đo vòng ngực và tham khảo bảng size chi tiết.',
                'keywords': ['size áo', 'áo', 'ngực', 'đo size']
            },
            {
                'knowledge_type': 'size_guide',
                'question': 'Cách chọn size quần phù hợp?',
                'answer': 'Để chọn size quần phù hợp: Size S (68-72cm eo), Size M (72-76cm eo), Size L (76-80cm eo), Size XL (80-84cm eo). Đo vòng eo và tham khảo bảng size để chọn size chính xác nhất.',
                'keywords': ['size quần', 'quần', 'eo', 'đo size']
            },
            {
                'knowledge_type': 'size_guide',
                'question': 'Cách chọn size giày phù hợp?',
                'answer': 'Để chọn size giày: Size 39 (24.5cm), Size 40 (25cm), Size 41 (25.5cm), Size 42 (26cm), Size 43 (26.5cm). Đo chiều dài bàn chân từ gót đến ngón chân dài nhất.',
                'keywords': ['size giày', 'giày', 'bàn chân', 'đo chân']
            }
        ]

        # Policy Knowledge
        policy_data = [
            {
                'knowledge_type': 'policy',
                'question': 'Chính sách bảo mật thông tin?',
                'answer': 'Chúng tôi cam kết bảo mật tuyệt đối thông tin cá nhân của khách hàng. Thông tin chỉ được sử dụng cho mục đích xử lý đơn hàng và không chia sẻ với bên thứ ba.',
                'keywords': ['bảo mật', 'privacy', 'thông tin cá nhân']
            },
            {
                'knowledge_type': 'policy',
                'question': 'Phương thức thanh toán nào được hỗ trợ?',
                'answer': 'Chúng tôi hỗ trợ thanh toán qua: 1) Thẻ tín dụng/ghi nợ, 2) Ví điện tử Paybox, 3) Chuyển khoản ngân hàng, 4) Thanh toán khi nhận hàng (COD).',
                'keywords': ['thanh toán', 'payment', 'thẻ', 'paybox', 'cod']
            }
        ]

        # General Knowledge
        general_data = [
            {
                'knowledge_type': 'general',
                'question': 'Liên hệ hỗ trợ khách hàng?',
                'answer': 'Bạn có thể liên hệ với chúng tôi qua: Email: support@shop.com, Hotline: 1900-xxxx, hoặc chat trực tiếp với tôi tại đây. Chúng tôi hỗ trợ 24/7.',
                'keywords': ['liên hệ', 'support', 'hotline', 'email']
            },
            {
                'knowledge_type': 'general',
                'question': 'Có chương trình khuyến mãi nào không?',
                'answer': 'Chúng tôi thường xuyên có các chương trình khuyến mãi hấp dẫn. Bạn có thể theo dõi trang chủ hoặc đăng ký nhận thông báo để không bỏ lỡ các ưu đãi đặc biệt.',
                'keywords': ['khuyến mãi', 'sale', 'discount', 'ưu đãi']
            }
        ]

        # Combine all data
        all_knowledge = faq_data + product_info_data + size_guide_data + policy_data + general_data

        # Create knowledge base entries
        created_count = 0
        for knowledge_data in all_knowledge:
            knowledge, created = AIKnowledgeBase.objects.get_or_create(
                question=knowledge_data['question'],
                defaults=knowledge_data
            )
            if created:
                created_count += 1
                self.stdout.write(f'Created: {knowledge.question[:50]}...')

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {created_count} knowledge base entries'
            )
        )
