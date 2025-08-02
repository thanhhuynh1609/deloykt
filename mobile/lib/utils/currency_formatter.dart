import 'package:intl/intl.dart';

class CurrencyFormatter {
  static final NumberFormat _vndFormatter = NumberFormat('#,###', 'vi_VN');
  
  /// Format amount to Vietnamese Dong format
  /// Example: 1000000 -> "1.000.000 VND"
  static String formatVND(double amount) {
    return '${_vndFormatter.format(amount.round())} VND';
  }
  
  /// Format amount to Vietnamese Dong format without currency symbol
  /// Example: 1000000 -> "1.000.000"
  static String formatVNDWithoutSymbol(double amount) {
    return _vndFormatter.format(amount.round());
  }
  
  /// Format amount with custom currency symbol
  /// Example: 1000000 -> "1.000.000 ₫"
  static String formatWithSymbol(double amount, String symbol) {
    return '${_vndFormatter.format(amount.round())} $symbol';
  }
  
  /// Parse formatted VND string back to double
  /// Example: "1.000.000" -> 1000000.0
  static double parseVND(String formattedAmount) {
    try {
      // Remove all non-digit characters except decimal point
      String cleanAmount = formattedAmount.replaceAll(RegExp(r'[^\d]'), '');
      return double.parse(cleanAmount);
    } catch (e) {
      return 0.0;
    }
  }
  
  /// Check if amount is valid (positive)
  static bool isValidAmount(double amount) {
    return amount > 0;
  }
  
  /// Format price range for products with variants
  /// Example: formatPriceRange(100000, 200000) -> "100.000 - 200.000 VND"
  static String formatPriceRange(double minPrice, double maxPrice) {
    if (minPrice == maxPrice) {
      return formatVND(minPrice);
    }
    return '${formatVNDWithoutSymbol(minPrice)} - ${formatVND(maxPrice)}';
  }
  
  /// Format discount amount
  /// Example: formatDiscount(50000) -> "-50.000 VND"
  static String formatDiscount(double amount) {
    return '-${formatVND(amount)}';
  }
  
  /// Format percentage
  /// Example: formatPercentage(0.1) -> "10%"
  static String formatPercentage(double percentage) {
    return '${(percentage * 100).toStringAsFixed(0)}%';
  }
}
