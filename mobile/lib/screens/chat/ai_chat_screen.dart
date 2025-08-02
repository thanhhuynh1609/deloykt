import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../constants/app_constants.dart';
import '../../providers/product_provider.dart';
import '../../models/product.dart';
import '../../utils/currency_formatter.dart';

class AiChatScreen extends StatefulWidget {
  const AiChatScreen({super.key});

  @override
  State<AiChatScreen> createState() => _AiChatScreenState();
}

class _AiChatScreenState extends State<AiChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<ChatMessage> _messages = [];
  bool _isTyping = false;

  @override
  void initState() {
    super.initState();
    _addWelcomeMessage();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _addWelcomeMessage() {
    _messages.add(ChatMessage(
      text: 'Xin chào! Tôi là AI assistant của shop. Tôi có thể giúp bạn:\n\n'
          '• Tìm kiếm sản phẩm\n'
          '• Tư vấn size\n'
          '• Thông tin đặt hàng\n'
          '• Hỗ trợ khách hàng\n\n'
          'Bạn cần hỗ trợ gì?',
      isUser: false,
      timestamp: DateTime.now(),
    ));
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    // Add user message
    setState(() {
      _messages.add(ChatMessage(
        text: text,
        isUser: true,
        timestamp: DateTime.now(),
      ));
      _isTyping = true;
    });

    _messageController.clear();
    _scrollToBottom();

    // Process message and get response
    await _processMessage(text);
  }

  Future<void> _processMessage(String message) async {
    try {
      // Simulate AI processing delay
      await Future.delayed(const Duration(milliseconds: 1500));

      String response;
      List<Product>? products;

      // Simple keyword-based responses (in real app, use NLP/AI service)
      if (_isProductSearchQuery(message)) {
        products = await _searchProducts(message);
        if (products.isNotEmpty) {
          response = 'Tôi tìm thấy ${products.length} sản phẩm phù hợp với yêu cầu của bạn:';
        } else {
          response = 'Xin lỗi, tôi không tìm thấy sản phẩm nào phù hợp. Bạn có thể thử từ khóa khác không?';
        }
      } else if (_isSizeQuery(message)) {
        response = _getSizeAdvice(message);
      } else if (_isOrderQuery(message)) {
        response = _getOrderInfo(message);
      } else if (_isGreeting(message)) {
        response = 'Xin chào! Tôi có thể giúp gì cho bạn hôm nay?';
      } else {
        response = _getGeneralResponse(message);
      }

      setState(() {
        _messages.add(ChatMessage(
          text: response,
          isUser: false,
          timestamp: DateTime.now(),
          products: products,
        ));
        _isTyping = false;
      });

      _scrollToBottom();
    } catch (e) {
      setState(() {
        _messages.add(ChatMessage(
          text: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
          isUser: false,
          timestamp: DateTime.now(),
        ));
        _isTyping = false;
      });
    }
  }

  bool _isProductSearchQuery(String message) {
    final keywords = ['tìm', 'search', 'sản phẩm', 'áo', 'quần', 'giày', 'túi', 'màu', 'size'];
    return keywords.any((keyword) => message.toLowerCase().contains(keyword));
  }

  bool _isSizeQuery(String message) {
    final keywords = ['size', 'kích thước', 'tư vấn size', 'size nào'];
    return keywords.any((keyword) => message.toLowerCase().contains(keyword));
  }

  bool _isOrderQuery(String message) {
    final keywords = ['đặt hàng', 'order', 'giao hàng', 'thanh toán', 'ship'];
    return keywords.any((keyword) => message.toLowerCase().contains(keyword));
  }

  bool _isGreeting(String message) {
    final keywords = ['xin chào', 'hello', 'hi', 'chào'];
    return keywords.any((keyword) => message.toLowerCase().contains(keyword));
  }

  Future<List<Product>> _searchProducts(String query) async {
    try {
      final productProvider = context.read<ProductProvider>();
      return await productProvider.aiSearchByText(query);
    } catch (e) {
      return [];
    }
  }

  String _getSizeAdvice(String message) {
    return 'Để tư vấn size chính xác, bạn vui lòng cung cấp:\n\n'
        '• Chiều cao và cân nặng\n'
        '• Loại sản phẩm (áo, quần, giày...)\n'
        '• Size hiện tại bạn thường mặc\n\n'
        'Hoặc bạn có thể tham khảo bảng size trong mô tả sản phẩm.';
  }

  String _getOrderInfo(String message) {
    return 'Thông tin về đặt hàng:\n\n'
        '• Miễn phí ship cho đơn hàng trên 500.000 VND\n'
        '• Thời gian giao hàng: 2-3 ngày\n'
        '• Thanh toán: Stripe hoặc Paybox Wallet\n'
        '• Hỗ trợ đổi trả trong 7 ngày\n\n'
        'Bạn cần hỗ trợ thêm gì không?';
  }

  String _getGeneralResponse(String message) {
    final responses = [
      'Tôi hiểu bạn đang cần hỗ trợ. Bạn có thể nói rõ hơn về vấn đề không?',
      'Để tôi có thể hỗ trợ tốt hơn, bạn có thể cho biết cụ thể bạn cần gì không?',
      'Tôi sẵn sàng giúp đỡ! Bạn có thể hỏi về sản phẩm, size, hoặc đặt hàng.',
    ];
    return responses[DateTime.now().millisecond % responses.length];
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            CircleAvatar(
              backgroundColor: AppConstants.successColor,
              child: Icon(Icons.smart_toy, color: Colors.white),
            ),
            SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('AI Assistant', style: TextStyle(fontSize: 16)),
                Text('Online', style: TextStyle(fontSize: 12, color: Colors.white70)),
              ],
            ),
          ],
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/home'),
        ),
      ),
      body: Column(
        children: [
          // Messages List
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(AppConstants.defaultPadding),
              itemCount: _messages.length + (_isTyping ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == _messages.length && _isTyping) {
                  return _buildTypingIndicator();
                }
                return _buildMessageBubble(_messages[index]);
              },
            ),
          ),

          // Message Input
          Container(
            padding: const EdgeInsets.all(AppConstants.defaultPadding),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 4,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: 'Nhập tin nhắn...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                    ),
                    maxLines: null,
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                const SizedBox(width: 8),
                FloatingActionButton(
                  onPressed: _sendMessage,
                  mini: true,
                  child: const Icon(Icons.send),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage message) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment: message.isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!message.isUser) ...[
            const CircleAvatar(
              backgroundColor: AppConstants.primaryColor,
              radius: 16,
              child: Icon(Icons.smart_toy, color: Colors.white, size: 16),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment: message.isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: message.isUser ? AppConstants.primaryColor : Colors.grey[200],
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    message.text,
                    style: TextStyle(
                      color: message.isUser ? Colors.white : Colors.black87,
                    ),
                  ),
                ),
                if (message.products != null && message.products!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  _buildProductCarousel(message.products!),
                ],
                const SizedBox(height: 4),
                Text(
                  _formatTime(message.timestamp),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppConstants.textSecondaryColor,
                  ),
                ),
              ],
            ),
          ),
          if (message.isUser) ...[
            const SizedBox(width: 8),
            const CircleAvatar(
              backgroundColor: AppConstants.successColor,
              radius: 16,
              child: Icon(Icons.person, color: Colors.white, size: 16),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildProductCarousel(List<Product> products) {
    return SizedBox(
      height: 200,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: products.length,
        itemBuilder: (context, index) {
          final product = products[index];
          return Container(
            width: 150,
            margin: const EdgeInsets.only(right: 8),
            child: Card(
              child: InkWell(
                onTap: () => context.go('/product/${product.id}'),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Container(
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: Colors.grey[200],
                          borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(AppConstants.borderRadius),
                          ),
                        ),
                        child: product.image != null
                            ? ClipRRect(
                                borderRadius: const BorderRadius.vertical(
                                  top: Radius.circular(AppConstants.borderRadius),
                                ),
                                child: Image.network(
                                  product.image!,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) {
                                    return const Icon(Icons.image_not_supported);
                                  },
                                ),
                              )
                            : const Icon(Icons.image_not_supported),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            product.name,
                            style: Theme.of(context).textTheme.bodySmall,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            CurrencyFormatter.formatVND(product.price),
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppConstants.primaryColor,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          const CircleAvatar(
            backgroundColor: AppConstants.primaryColor,
            radius: 16,
            child: Icon(Icons.smart_toy, color: Colors.white, size: 16),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey[200],
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildDot(0),
                const SizedBox(width: 4),
                _buildDot(1),
                const SizedBox(width: 4),
                _buildDot(2),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDot(int index) {
    return AnimatedContainer(
      duration: Duration(milliseconds: 600 + (index * 200)),
      width: 8,
      height: 8,
      decoration: BoxDecoration(
        color: AppConstants.primaryColor.withOpacity(0.7),
        shape: BoxShape.circle,
      ),
    );
  }

  String _formatTime(DateTime time) {
    return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
  }
}

class ChatMessage {
  final String text;
  final bool isUser;
  final DateTime timestamp;
  final List<Product>? products;

  ChatMessage({
    required this.text,
    required this.isUser,
    required this.timestamp,
    this.products,
  });
}
