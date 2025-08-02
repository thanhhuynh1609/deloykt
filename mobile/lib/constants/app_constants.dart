import 'package:flutter/material.dart';

class AppConstants {
  // App Info
  static const String appName = 'E-commerce Mobile';
  static const String appVersion = '1.0.0';
  
  // Storage Keys
  static const String authTokenKey = 'authTokens';
  static const String userInfoKey = 'userInfo';
  static const String cartItemsKey = 'cartItems';
  static const String shippingAddressKey = 'shippingAddress';
  static const String paymentMethodKey = 'paymentMethod';
  static const String couponCodeKey = 'couponCode';
  static const String favoritesKey = 'favorites';
  
  // Default Values
  static const double defaultShippingPrice = 50000; // 50,000 VND
  static const double defaultTaxRate = 0.1; // 10%
  static const String defaultPaymentMethod = 'Stripe';
  
  // UI Constants
  static const double defaultPadding = 16.0;
  static const double smallPadding = 8.0;
  static const double largePadding = 24.0;
  static const double borderRadius = 8.0;
  static const double cardElevation = 2.0;
  
  // Colors
  static const Color primaryColor = Color(0xFF2196F3);
  static const Color secondaryColor = Color(0xFF4CAF50);
  static const Color errorColor = Color(0xFFE53E3E);
  static const Color warningColor = Color(0xFFFF9800);
  static const Color successColor = Color(0xFF4CAF50);
  static const Color backgroundColor = Color(0xFFF5F5F5);
  static const Color cardColor = Colors.white;
  static const Color textPrimaryColor = Color(0xFF212121);
  static const Color textSecondaryColor = Color(0xFF757575);
  
  // Currency
  static const String currencySymbol = 'VND';
  static const String currencyCode = 'VND';
  
  // Image Placeholders
  static const String placeholderImage = 'assets/images/placeholder.png';
  static const String noImageAvailable = 'assets/images/no_image.png';
  
  // Validation
  static const int minPasswordLength = 6;
  static const int maxUsernameLength = 30;
  static const int maxEmailLength = 254;
  
  // Pagination
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;
  
  // Chat
  static const int maxMessageLength = 1000;
  static const int chatHistoryLimit = 100;
  
  // Product
  static const int maxProductImages = 5;
  static const int maxReviewLength = 500;
  static const double minRating = 1.0;
  static const double maxRating = 5.0;
  
  // Order Status
  static const String orderStatusPending = 'pending';
  static const String orderStatusPaid = 'paid';
  static const String orderStatusDelivered = 'delivered';
  static const String orderStatusCancelled = 'cancelled';
  
  // Payment Methods
  static const String paymentMethodStripe = 'Stripe';
  static const String paymentMethodPaybox = 'Paybox';
  
  // Error Messages
  static const String networkErrorMessage = 'Lỗi kết nối mạng. Vui lòng thử lại.';
  static const String serverErrorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
  static const String unknownErrorMessage = 'Đã xảy ra lỗi không xác định.';
  static const String authErrorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  
  // Success Messages
  static const String loginSuccessMessage = 'Đăng nhập thành công!';
  static const String registerSuccessMessage = 'Đăng ký thành công!';
  static const String addToCartSuccessMessage = 'Đã thêm vào giỏ hàng!';
  static const String orderPlacedSuccessMessage = 'Đặt hàng thành công!';
  
  // Timeouts
  static const Duration apiTimeout = Duration(seconds: 30);
  static const Duration connectTimeout = Duration(seconds: 10);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
