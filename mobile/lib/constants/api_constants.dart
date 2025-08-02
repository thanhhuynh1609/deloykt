class ApiConstants {
  // Base URL for the API
  static const String baseUrl = 'https://ecommerce-web-7q4f.onrender.com';
  
  // API Endpoints
  static const String apiPrefix = '/api';
  static const String authPrefix = '/auth';
  
  // Authentication endpoints
  static const String login = '$authPrefix/jwt/create/';
  static const String register = '$authPrefix/users/';
  static const String refreshToken = '$authPrefix/jwt/refresh/';
  static const String userProfile = '$authPrefix/users/me/';
  
  // Product endpoints
  static const String products = '$apiPrefix/products/';
  static const String brands = '$apiPrefix/brands/';
  static const String categories = '$apiPrefix/category/';
  static const String colors = '$apiPrefix/colors/';
  static const String sizes = '$apiPrefix/sizes/';
  static const String productVariants = '$apiPrefix/product-variants/';
  
  // Order endpoints
  static const String orders = '$apiPrefix/orders/';
  static const String placeOrder = '$apiPrefix/placeorder/';
  
  // Cart and favorites
  static const String favorites = '$apiPrefix/favorites/';
  
  // Payment endpoints
  static const String stripePayment = '$apiPrefix/stripe-payment/';
  static const String payboxWallet = '$apiPrefix/paybox/wallet/';
  static const String payboxDeposit = '$apiPrefix/paybox/deposit/';
  static const String payboxPayment = '$apiPrefix/paybox/payment/';
  static const String payboxTransactions = '$apiPrefix/paybox/transactions/';
  
  // AI Search endpoints
  static const String aiSearchText = '$apiPrefix/ai-search/text/';
  static const String aiSearchImage = '$apiPrefix/ai-search/image/';
  static const String aiSearchCombined = '$apiPrefix/ai-search/combined/';
  
  // Chat endpoints
  static const String chatMessages = '$apiPrefix/chat/messages/';
  
  // WebSocket URLs
  static const String wsBaseUrl = 'wss://ecommerce-web-7q4f.onrender.com';
  static const String chatWebSocket = '/ws/chat/';
  
  // Helper methods
  static String getProductVariantUrl(int productId, int colorId, int sizeId) {
    return '$apiPrefix/products/$productId/variants/$colorId/$sizeId/';
  }
  
  static String getProductReviewsUrl(int productId) {
    return '$apiPrefix/products/$productId/reviews/';
  }
  
  static String getOrderPayUrl(int orderId) {
    return '$apiPrefix/orders/$orderId/pay/';
  }
  
  static String getChatMessagesUrl(String roomName) {
    return '$apiPrefix/chat/messages/$roomName/';
  }
  
  static String getChatWebSocketUrl(String roomName) {
    return '$wsBaseUrl$chatWebSocket$roomName/';
  }
}
