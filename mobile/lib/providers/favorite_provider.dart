import 'package:flutter/foundation.dart';
import '../models/product.dart';
import '../services/product_service.dart';
import '../utils/storage_helper.dart';

class FavoriteProvider with ChangeNotifier {
  final ProductService _productService = ProductService();
  
  List<int> _favoriteIds = [];
  List<Product> _favoriteProducts = [];
  bool _isLoading = false;
  String? _error;

  // Getters
  List<int> get favoriteIds => _favoriteIds;
  List<Product> get favoriteProducts => _favoriteProducts;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get favoriteCount => _favoriteIds.length;
  bool get hasFavorites => _favoriteIds.isNotEmpty;

  // Initialize
  Future<void> initialize() async {
    await _loadFavoritesFromStorage();
    await _loadFavoriteProducts();
  }

  // Check if product is favorite
  bool isFavorite(int productId) {
    return _favoriteIds.contains(productId);
  }

  // Add to favorites
  Future<void> addToFavorites(int productId) async {
    if (!_favoriteIds.contains(productId)) {
      _favoriteIds.add(productId);
      await _saveFavoritesToStorage();
      await _loadFavoriteProducts();
      notifyListeners();
    }
  }

  // Remove from favorites
  Future<void> removeFromFavorites(int productId) async {
    if (_favoriteIds.contains(productId)) {
      _favoriteIds.remove(productId);
      _favoriteProducts.removeWhere((product) => product.id == productId);
      await _saveFavoritesToStorage();
      notifyListeners();
    }
  }

  // Toggle favorite
  Future<void> toggleFavorite(int productId) async {
    if (isFavorite(productId)) {
      await removeFromFavorites(productId);
    } else {
      await addToFavorites(productId);
    }
  }

  // Clear all favorites
  Future<void> clearFavorites() async {
    _favoriteIds.clear();
    _favoriteProducts.clear();
    await _saveFavoritesToStorage();
    notifyListeners();
  }

  // Load favorite products details
  Future<void> loadFavoriteProducts() async {
    await _loadFavoriteProducts();
  }

  // Get favorite products by category
  List<Product> getFavoritesByCategory(int categoryId) {
    return _favoriteProducts
        .where((product) => product.category.id == categoryId)
        .toList();
  }

  // Get favorite products by brand
  List<Product> getFavoritesByBrand(int brandId) {
    return _favoriteProducts
        .where((product) => product.brand.id == brandId)
        .toList();
  }

  // Get favorite products in price range
  List<Product> getFavoritesInPriceRange(double minPrice, double maxPrice) {
    return _favoriteProducts
        .where((product) => product.price >= minPrice && product.price <= maxPrice)
        .toList();
  }

  // Get favorite products sorted by price
  List<Product> getFavoritesSortedByPrice({bool ascending = true}) {
    final sorted = List<Product>.from(_favoriteProducts);
    sorted.sort((a, b) => ascending 
        ? a.price.compareTo(b.price)
        : b.price.compareTo(a.price));
    return sorted;
  }

  // Get favorite products sorted by name
  List<Product> getFavoritesSortedByName({bool ascending = true}) {
    final sorted = List<Product>.from(_favoriteProducts);
    sorted.sort((a, b) => ascending 
        ? a.name.compareTo(b.name)
        : b.name.compareTo(a.name));
    return sorted;
  }

  // Get favorite products sorted by rating
  List<Product> getFavoritesSortedByRating({bool ascending = false}) {
    final sorted = List<Product>.from(_favoriteProducts);
    sorted.sort((a, b) {
      final ratingA = a.rating ?? 0.0;
      final ratingB = b.rating ?? 0.0;
      return ascending 
          ? ratingA.compareTo(ratingB)
          : ratingB.compareTo(ratingA);
    });
    return sorted;
  }

  // Get favorite products sorted by date added (newest first)
  List<Product> getFavoritesSortedByDateAdded() {
    final sorted = List<Product>.from(_favoriteProducts);
    sorted.sort((a, b) => DateTime.parse(b.createdAt).compareTo(DateTime.parse(a.createdAt)));
    return sorted;
  }

  // Search in favorites
  List<Product> searchFavorites(String query) {
    if (query.isEmpty) return _favoriteProducts;
    
    final lowercaseQuery = query.toLowerCase();
    return _favoriteProducts.where((product) {
      return product.name.toLowerCase().contains(lowercaseQuery) ||
             product.description?.toLowerCase().contains(lowercaseQuery) == true ||
             product.brand.name.toLowerCase().contains(lowercaseQuery) ||
             product.category.name.toLowerCase().contains(lowercaseQuery);
    }).toList();
  }

  // Get favorite products that are in stock
  List<Product> getInStockFavorites() {
    return _favoriteProducts.where((product) => product.isInStock).toList();
  }

  // Get favorite products that are out of stock
  List<Product> getOutOfStockFavorites() {
    return _favoriteProducts.where((product) => !product.isInStock).toList();
  }

  // Get favorite products with discount (if implemented)
  List<Product> getDiscountedFavorites() {
    // This would need to be implemented based on your discount logic
    return _favoriteProducts;
  }

  // Get statistics
  Map<String, dynamic> getFavoriteStats() {
    final inStock = getInStockFavorites().length;
    final outOfStock = getOutOfStockFavorites().length;
    final totalValue = _favoriteProducts.fold(0.0, (sum, product) => sum + product.price);
    final avgPrice = _favoriteProducts.isNotEmpty ? totalValue / _favoriteProducts.length : 0.0;
    
    // Group by category
    final categoryGroups = <String, int>{};
    for (final product in _favoriteProducts) {
      final categoryName = product.category.name;
      categoryGroups[categoryName] = (categoryGroups[categoryName] ?? 0) + 1;
    }
    
    // Group by brand
    final brandGroups = <String, int>{};
    for (final product in _favoriteProducts) {
      final brandName = product.brand.name;
      brandGroups[brandName] = (brandGroups[brandName] ?? 0) + 1;
    }

    return {
      'total_favorites': _favoriteIds.length,
      'in_stock': inStock,
      'out_of_stock': outOfStock,
      'total_value': totalValue,
      'average_price': avgPrice,
      'categories': categoryGroups,
      'brands': brandGroups,
    };
  }

  // Export favorites (returns list of product IDs)
  List<int> exportFavorites() {
    return List<int>.from(_favoriteIds);
  }

  // Import favorites
  Future<void> importFavorites(List<int> productIds) async {
    _favoriteIds = List<int>.from(productIds);
    await _saveFavoritesToStorage();
    await _loadFavoriteProducts();
    notifyListeners();
  }

  // Private methods
  Future<void> _loadFavoritesFromStorage() async {
    _favoriteIds = StorageHelper.getFavorites();
  }

  Future<void> _saveFavoritesToStorage() async {
    await StorageHelper.saveFavorites(_favoriteIds);
  }

  Future<void> _loadFavoriteProducts() async {
    if (_favoriteIds.isEmpty) {
      _favoriteProducts = [];
      return;
    }

    _setLoading(true);
    try {
      final products = <Product>[];
      
      for (final productId in _favoriteIds) {
        try {
          final product = await _productService.getProduct(productId);
          products.add(product);
        } catch (e) {
          // Remove invalid product ID from favorites
          _favoriteIds.remove(productId);
          debugPrint('Error loading favorite product $productId: $e');
        }
      }
      
      _favoriteProducts = products;
      await _saveFavoritesToStorage(); // Save cleaned up favorites
      _clearError();
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
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

  // Refresh favorites
  Future<void> refresh() async {
    await _loadFavoriteProducts();
  }

  // Batch operations
  Future<void> addMultipleToFavorites(List<int> productIds) async {
    bool hasChanges = false;
    for (final productId in productIds) {
      if (!_favoriteIds.contains(productId)) {
        _favoriteIds.add(productId);
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      await _saveFavoritesToStorage();
      await _loadFavoriteProducts();
      notifyListeners();
    }
  }

  Future<void> removeMultipleFromFavorites(List<int> productIds) async {
    bool hasChanges = false;
    for (final productId in productIds) {
      if (_favoriteIds.contains(productId)) {
        _favoriteIds.remove(productId);
        _favoriteProducts.removeWhere((product) => product.id == productId);
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      await _saveFavoritesToStorage();
      notifyListeners();
    }
  }
}
