import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';
import '../models/user.dart';
import '../models/cart.dart';

class StorageHelper {
  static SharedPreferences? _prefs;
  
  static Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }
  
  static SharedPreferences get prefs {
    if (_prefs == null) {
      throw Exception('StorageHelper not initialized. Call StorageHelper.init() first.');
    }
    return _prefs!;
  }
  
  // Auth Tokens
  static Future<void> saveAuthTokens(AuthTokens tokens) async {
    await prefs.setString(AppConstants.authTokenKey, jsonEncode(tokens.toJson()));
  }
  
  static AuthTokens? getAuthTokens() {
    final tokensJson = prefs.getString(AppConstants.authTokenKey);
    if (tokensJson != null) {
      try {
        return AuthTokens.fromJson(jsonDecode(tokensJson));
      } catch (e) {
        return null;
      }
    }
    return null;
  }
  
  static Future<void> clearAuthTokens() async {
    await prefs.remove(AppConstants.authTokenKey);
  }
  
  // User Info
  static Future<void> saveUserInfo(User user) async {
    await prefs.setString(AppConstants.userInfoKey, jsonEncode(user.toJson()));
  }
  
  static User? getUserInfo() {
    final userJson = prefs.getString(AppConstants.userInfoKey);
    if (userJson != null) {
      try {
        return User.fromJson(jsonDecode(userJson));
      } catch (e) {
        return null;
      }
    }
    return null;
  }
  
  static Future<void> clearUserInfo() async {
    await prefs.remove(AppConstants.userInfoKey);
  }
  
  // Cart Items
  static Future<void> saveCartItems(List<CartItem> items) async {
    final itemsJson = items.map((item) => item.toJson()).toList();
    await prefs.setString(AppConstants.cartItemsKey, jsonEncode(itemsJson));
  }
  
  static List<CartItem> getCartItems() {
    final itemsJson = prefs.getString(AppConstants.cartItemsKey);
    if (itemsJson != null) {
      try {
        final List<dynamic> itemsList = jsonDecode(itemsJson);
        return itemsList.map((item) => CartItem.fromJson(item)).toList();
      } catch (e) {
        return [];
      }
    }
    return [];
  }
  
  static Future<void> clearCartItems() async {
    await prefs.remove(AppConstants.cartItemsKey);
  }
  
  // Shipping Address
  static Future<void> saveShippingAddress(ShippingAddress address) async {
    await prefs.setString(AppConstants.shippingAddressKey, jsonEncode(address.toJson()));
  }
  
  static ShippingAddress? getShippingAddress() {
    final addressJson = prefs.getString(AppConstants.shippingAddressKey);
    if (addressJson != null) {
      try {
        return ShippingAddress.fromJson(jsonDecode(addressJson));
      } catch (e) {
        return null;
      }
    }
    return null;
  }
  
  static Future<void> clearShippingAddress() async {
    await prefs.remove(AppConstants.shippingAddressKey);
  }
  
  // Payment Method
  static Future<void> savePaymentMethod(String method) async {
    await prefs.setString(AppConstants.paymentMethodKey, method);
  }
  
  static String getPaymentMethod() {
    return prefs.getString(AppConstants.paymentMethodKey) ?? AppConstants.defaultPaymentMethod;
  }
  
  static Future<void> clearPaymentMethod() async {
    await prefs.remove(AppConstants.paymentMethodKey);
  }
  
  // Coupon Code
  static Future<void> saveCouponCode(String code) async {
    await prefs.setString(AppConstants.couponCodeKey, code);
  }
  
  static String? getCouponCode() {
    return prefs.getString(AppConstants.couponCodeKey);
  }
  
  static Future<void> clearCouponCode() async {
    await prefs.remove(AppConstants.couponCodeKey);
  }
  
  // Favorites
  static Future<void> saveFavorites(List<int> productIds) async {
    await prefs.setStringList(AppConstants.favoritesKey, productIds.map((id) => id.toString()).toList());
  }
  
  static List<int> getFavorites() {
    final favorites = prefs.getStringList(AppConstants.favoritesKey);
    if (favorites != null) {
      try {
        return favorites.map((id) => int.parse(id)).toList();
      } catch (e) {
        return [];
      }
    }
    return [];
  }
  
  static Future<void> clearFavorites() async {
    await prefs.remove(AppConstants.favoritesKey);
  }
  
  // Generic methods
  static Future<void> saveString(String key, String value) async {
    await prefs.setString(key, value);
  }
  
  static String? getString(String key) {
    return prefs.getString(key);
  }
  
  static Future<void> saveBool(String key, bool value) async {
    await prefs.setBool(key, value);
  }
  
  static bool getBool(String key, {bool defaultValue = false}) {
    return prefs.getBool(key) ?? defaultValue;
  }
  
  static Future<void> saveInt(String key, int value) async {
    await prefs.setInt(key, value);
  }
  
  static int getInt(String key, {int defaultValue = 0}) {
    return prefs.getInt(key) ?? defaultValue;
  }
  
  static Future<void> saveDouble(String key, double value) async {
    await prefs.setDouble(key, value);
  }
  
  static double getDouble(String key, {double defaultValue = 0.0}) {
    return prefs.getDouble(key) ?? defaultValue;
  }
  
  static Future<void> remove(String key) async {
    await prefs.remove(key);
  }
  
  static Future<void> clear() async {
    await prefs.clear();
  }
  
  // Check if user is logged in
  static bool get isLoggedIn {
    final tokens = getAuthTokens();
    return tokens != null && tokens.access.isNotEmpty;
  }
  
  // Clear all user-related data (logout)
  static Future<void> clearUserData() async {
    await Future.wait([
      clearAuthTokens(),
      clearUserInfo(),
      clearCartItems(),
      clearShippingAddress(),
      clearPaymentMethod(),
      clearCouponCode(),
      clearFavorites(),
    ]);
  }
}
