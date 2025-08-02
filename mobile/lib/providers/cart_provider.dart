import 'package:flutter/foundation.dart';
import '../models/cart.dart';
import '../models/product.dart';
import '../services/product_service.dart';
import '../utils/storage_helper.dart';
import '../utils/currency_formatter.dart';

class CartProvider with ChangeNotifier {
  final ProductService _productService = ProductService();
  
  List<CartItem> _items = [];
  ShippingAddress? _shippingAddress;
  String _paymentMethod = 'Stripe';
  String? _couponCode;
  double _discountAmount = 0.0;
  String? _couponMessage;
  bool _isLoading = false;
  String? _error;

  // Getters
  List<CartItem> get items => _items;
  ShippingAddress? get shippingAddress => _shippingAddress;
  String get paymentMethod => _paymentMethod;
  String? get couponCode => _couponCode;
  double get discountAmount => _discountAmount;
  String? get couponMessage => _couponMessage;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Cart calculations
  double get itemsPrice {
    return _items.fold(0.0, (sum, item) => sum + item.totalPrice);
  }

  double get shippingPrice {
    return itemsPrice > 500000 ? 0.0 : 50000; // Free shipping over 500k VND
  }

  double get taxPrice {
    return itemsPrice * 0.1; // 10% tax
  }

  double get totalPrice {
    return itemsPrice + shippingPrice + taxPrice - _discountAmount;
  }

  int get totalItems {
    return _items.fold(0, (sum, item) => sum + item.qty);
  }

  bool get isEmpty => _items.isEmpty;
  bool get isNotEmpty => _items.isNotEmpty;

  // Initialize cart
  Future<void> initialize() async {
    await _loadCartFromStorage();
    await _loadShippingAddress();
    await _loadPaymentMethod();
    await _loadCouponCode();
  }

  // Add item to cart
  Future<void> addItem({
    required int productId,
    required int quantity,
    int? variantId,
    String? color,
    String? size,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      // Check if item already exists
      final existingIndex = _items.indexWhere((item) => 
        item.id == productId && item.variantId == variantId);

      if (existingIndex >= 0) {
        // Update quantity
        _items[existingIndex] = _items[existingIndex].copyWith(
          qty: _items[existingIndex].qty + quantity,
        );
      } else {
        // Add new item
        final cartItem = CartItem(
          id: productId,
          qty: quantity,
          variantId: variantId,
          color: color,
          size: size,
        );
        _items.add(cartItem);
      }

      await _saveCartToStorage();
      await _enrichCartItems();
      notifyListeners();
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  // Update item quantity
  Future<void> updateItemQuantity(int productId, int? variantId, int quantity) async {
    if (quantity <= 0) {
      await removeItem(productId, variantId);
      return;
    }

    final index = _items.indexWhere((item) => 
      item.id == productId && item.variantId == variantId);

    if (index >= 0) {
      _items[index] = _items[index].copyWith(qty: quantity);
      await _saveCartToStorage();
      notifyListeners();
    }
  }

  // Remove item from cart
  Future<void> removeItem(int productId, int? variantId) async {
    _items.removeWhere((item) => 
      item.id == productId && item.variantId == variantId);
    
    await _saveCartToStorage();
    notifyListeners();
  }

  // Clear cart
  Future<void> clearCart() async {
    _items.clear();
    _couponCode = null;
    _discountAmount = 0.0;
    _couponMessage = null;
    
    await _saveCartToStorage();
    await StorageHelper.clearCouponCode();
    notifyListeners();
  }

  // Update shipping address
  Future<void> updateShippingAddress(ShippingAddress address) async {
    _shippingAddress = address;
    await StorageHelper.saveShippingAddress(address);
    notifyListeners();
  }

  // Update payment method
  Future<void> updatePaymentMethod(String method) async {
    _paymentMethod = method;
    await StorageHelper.savePaymentMethod(method);
    notifyListeners();
  }

  // Apply coupon
  Future<bool> applyCoupon(String code) async {
    _setLoading(true);
    _clearError();

    try {
      // TODO: Implement coupon validation API call
      // For now, simulate coupon validation
      if (code.toLowerCase() == 'discount10') {
        _couponCode = code;
        _discountAmount = itemsPrice * 0.1; // 10% discount
        _couponMessage = 'Coupon applied successfully! 10% discount';
        await StorageHelper.saveCouponCode(code);
      } else {
        _couponMessage = 'Invalid coupon code';
        return false;
      }

      notifyListeners();
      return true;
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Remove coupon
  Future<void> removeCoupon() async {
    _couponCode = null;
    _discountAmount = 0.0;
    _couponMessage = null;
    await StorageHelper.clearCouponCode();
    notifyListeners();
  }

  // Get cart as Cart model
  Cart getCart() {
    return Cart(
      items: _items,
      shippingAddress: _shippingAddress,
      paymentMethod: _paymentMethod,
      couponCode: _couponCode,
      discountAmount: _discountAmount,
    );
  }

  // Check if product is in cart
  bool isInCart(int productId, {int? variantId}) {
    return _items.any((item) => 
      item.id == productId && item.variantId == variantId);
  }

  // Get item quantity in cart
  int getItemQuantity(int productId, {int? variantId}) {
    try {
      final item = _items.firstWhere(
        (item) => item.id == productId && item.variantId == variantId,
      );
      return item.qty;
    } catch (e) {
      return 0;
    }
  }

  // Format prices
  String get formattedItemsPrice => CurrencyFormatter.formatVND(itemsPrice);
  String get formattedShippingPrice => CurrencyFormatter.formatVND(shippingPrice);
  String get formattedTaxPrice => CurrencyFormatter.formatVND(taxPrice);
  String get formattedDiscountAmount => CurrencyFormatter.formatVND(_discountAmount);
  String get formattedTotalPrice => CurrencyFormatter.formatVND(totalPrice);

  // Private methods
  Future<void> _loadCartFromStorage() async {
    _items = StorageHelper.getCartItems();
    await _enrichCartItems();
  }

  Future<void> _saveCartToStorage() async {
    await StorageHelper.saveCartItems(_items);
  }

  Future<void> _loadShippingAddress() async {
    _shippingAddress = StorageHelper.getShippingAddress();
  }

  Future<void> _loadPaymentMethod() async {
    _paymentMethod = StorageHelper.getPaymentMethod();
  }

  Future<void> _loadCouponCode() async {
    _couponCode = StorageHelper.getCouponCode();
    if (_couponCode != null) {
      await applyCoupon(_couponCode!);
    }
  }

  Future<void> _enrichCartItems() async {
    // Enrich cart items with product details
    for (int i = 0; i < _items.length; i++) {
      try {
        final product = await _productService.getProduct(_items[i].id);
        ProductVariant? variant;
        
        if (_items[i].variantId != null) {
          // Find variant in product variants
          try {
            variant = product.variants?.firstWhere(
              (v) => v.id == _items[i].variantId,
            );
          } catch (e) {
            variant = null;
          }
        }

        _items[i] = _items[i].copyWith(
          product: product,
          variant: variant,
          price: variant?.price ?? product.price,
          image: variant?.image ?? product.image,
          name: product.name,
        );
      } catch (e) {
        // Handle error for individual items
        debugPrint('Error enriching cart item ${_items[i].id}: $e');
      }
    }
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
    notifyListeners();
  }

  void clearError() {
    _clearError();
  }

  // Validate cart for checkout
  bool validateForCheckout() {
    if (isEmpty) return false;
    if (_shippingAddress == null) return false;
    if (_paymentMethod.isEmpty) return false;
    return true;
  }

  // Get validation errors
  List<String> getValidationErrors() {
    final errors = <String>[];
    
    if (isEmpty) errors.add('Cart is empty');
    if (_shippingAddress == null) errors.add('Shipping address is required');
    if (_paymentMethod.isEmpty) errors.add('Payment method is required');
    
    return errors;
  }
}
