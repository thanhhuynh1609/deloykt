import 'dart:io';
import 'package:flutter/foundation.dart';
import '../models/product.dart' as models;
import '../services/product_service.dart';

class ProductProvider with ChangeNotifier {
  final ProductService _productService = ProductService();
  
  List<models.Product> _products = [];
  List<models.Product> _featuredProducts = [];
  List<models.Product> _newArrivals = [];
  List<models.Brand> _brands = [];
  List<models.Category> _categories = [];
  List<models.Color> _colors = [];
  List<models.Size> _sizes = [];

  models.Product? _selectedProduct;
  List<models.ProductVariant> _selectedProductVariants = [];
  
  bool _isLoading = false;
  bool _isLoadingProduct = false;
  bool _isSearching = false;
  String? _error;
  
  // Search and filter state
  String _searchQuery = '';
  int? _selectedCategoryId;
  int? _selectedBrandId;
  double? _minPrice;
  double? _maxPrice;
  String? _sortBy;

  // Getters
  List<models.Product> get products => _products;
  List<models.Product> get featuredProducts => _featuredProducts;
  List<models.Product> get newArrivals => _newArrivals;
  List<models.Brand> get brands => _brands;
  List<models.Category> get categories => _categories;
  List<models.Color> get colors => _colors;
  List<models.Size> get sizes => _sizes;

  models.Product? get selectedProduct => _selectedProduct;
  List<models.ProductVariant> get selectedProductVariants => _selectedProductVariants;
  
  bool get isLoading => _isLoading;
  bool get isLoadingProduct => _isLoadingProduct;
  bool get isSearching => _isSearching;
  String? get error => _error;
  
  String get searchQuery => _searchQuery;
  int? get selectedCategoryId => _selectedCategoryId;
  int? get selectedBrandId => _selectedBrandId;
  double? get minPrice => _minPrice;
  double? get maxPrice => _maxPrice;
  String? get sortBy => _sortBy;

  // Initialize
  Future<void> initialize() async {
    await loadBasicData();
    await loadFeaturedProducts();
    await loadNewArrivals();
  }

  // Load basic data (brands, categories, colors, sizes)
  Future<void> loadBasicData() async {
    if (_isLoading) {
      debugPrint('ProductProvider: loadBasicData already loading, skipping');
      return;
    }

    debugPrint('ProductProvider: loadBasicData starting');
    _setLoading(true);
    try {
      final results = await Future.wait([
        _productService.getBrands(),
        _productService.getCategories(),
        _productService.getColors(),
        _productService.getSizes(),
      ]);

      _brands = results[0] as List<models.Brand>;
      _categories = results[1] as List<models.Category>;
      _colors = results[2] as List<models.Color>;
      _sizes = results[3] as List<models.Size>;

      debugPrint('ProductProvider: loadBasicData completed');
      _clearError();
    } catch (e) {
      debugPrint('ProductProvider: loadBasicData error: $e');
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  // Load products with filters
  Future<void> loadProducts({
    String? search,
    int? categoryId,
    int? brandId,
    double? minPrice,
    double? maxPrice,
    String? ordering,
    bool refresh = false,
  }) async {
    if (refresh) _products.clear();
    
    _setLoading(true);
    try {
      final products = await _productService.getProducts(
        search: search,
        categoryId: categoryId,
        brandId: brandId,
        minPrice: minPrice,
        maxPrice: maxPrice,
        ordering: ordering,
      );
      
      _products = products;
      _clearError();
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  // Load featured products
  Future<void> loadFeaturedProducts() async {
    if (_isLoading) {
      debugPrint('ProductProvider: loadFeaturedProducts already loading, skipping');
      return;
    }

    debugPrint('ProductProvider: loadFeaturedProducts starting');
    try {
      _featuredProducts = await _productService.getFeaturedProducts();
      debugPrint('ProductProvider: loadFeaturedProducts completed, ${_featuredProducts.length} products');
      notifyListeners();
    } catch (e) {
      debugPrint('ProductProvider: loadFeaturedProducts error: $e');
    }
  }

  // Load new arrivals
  Future<void> loadNewArrivals() async {
    try {
      _newArrivals = await _productService.getNewArrivals();
      notifyListeners();
    } catch (e) {
      debugPrint('Error loading new arrivals: $e');
    }
  }

  // Load brands
  Future<void> loadBrands() async {
    try {
      _brands = await _productService.getBrands();
      notifyListeners();
    } catch (e) {
      debugPrint('Error loading brands: $e');
    }
  }

  // Load categories
  Future<void> loadCategories() async {
    try {
      _categories = await _productService.getCategories();
      notifyListeners();
    } catch (e) {
      debugPrint('Error loading categories: $e');
    }
  }

  /// AI-powered search for chatbot
  Future<List<models.Product>> aiSearchByText(String query) async {
    try {
      // Extract keywords and search parameters from natural language
      final searchParams = _parseNaturalLanguageQuery(query);

      return await _productService.getProducts(
        search: searchParams['search'],
        categoryId: searchParams['categoryId'],
        brandId: searchParams['brandId'],
        minPrice: searchParams['minPrice'],
        maxPrice: searchParams['maxPrice'],
        pageSize: 10, // Limit results for chat
      );
    } catch (e) {
      return [];
    }
  }

  /// Parse natural language query into search parameters
  Map<String, dynamic> _parseNaturalLanguageQuery(String query) {
    final params = <String, dynamic>{};
    final lowerQuery = query.toLowerCase();

    // Extract search terms
    String searchTerms = query;

    // Extract category
    if (lowerQuery.contains('áo') || lowerQuery.contains('shirt')) {
      params['categoryId'] = 1; // Assuming category ID 1 is for shirts
      searchTerms = searchTerms.replaceAll(RegExp(r'áo|shirt', caseSensitive: false), '').trim();
    } else if (lowerQuery.contains('quần') || lowerQuery.contains('pants')) {
      params['categoryId'] = 2; // Assuming category ID 2 is for pants
      searchTerms = searchTerms.replaceAll(RegExp(r'quần|pants', caseSensitive: false), '').trim();
    } else if (lowerQuery.contains('giày') || lowerQuery.contains('shoes')) {
      params['categoryId'] = 4; // Assuming category ID 4 is for shoes
      searchTerms = searchTerms.replaceAll(RegExp(r'giày|shoes', caseSensitive: false), '').trim();
    }

    // Extract brand
    if (lowerQuery.contains('adidas')) {
      params['brandId'] = 2; // Assuming brand ID 2 is Adidas
      searchTerms = searchTerms.replaceAll(RegExp(r'adidas', caseSensitive: false), '').trim();
    } else if (lowerQuery.contains('gucci')) {
      params['brandId'] = 3; // Assuming brand ID 3 is Gucci
      searchTerms = searchTerms.replaceAll(RegExp(r'gucci', caseSensitive: false), '').trim();
    }

    // Extract colors
    final colorKeywords = {
      'đỏ': 'red',
      'xanh': 'blue',
      'đen': 'black',
      'trắng': 'white',
      'vàng': 'yellow',
      'xám': 'gray',
    };

    for (final entry in colorKeywords.entries) {
      if (lowerQuery.contains(entry.key) || lowerQuery.contains(entry.value)) {
        searchTerms += ' ${entry.value}';
        break;
      }
    }

    // Extract size
    final sizePattern = RegExp(r'size\s*(\d+|[smlxl]+)', caseSensitive: false);
    final sizeMatch = sizePattern.firstMatch(lowerQuery);
    if (sizeMatch != null) {
      searchTerms += ' ${sizeMatch.group(1)}';
    }

    // Clean up search terms
    searchTerms = searchTerms.replaceAll(RegExp(r'\s+'), ' ').trim();
    if (searchTerms.isNotEmpty) {
      params['search'] = searchTerms;
    }

    return params;
  }

  // Load product details
  Future<void> loadProduct(int productId) async {
    _setLoadingProduct(true);
    try {
      _selectedProduct = await _productService.getProduct(productId);
      
      if (_selectedProduct!.hasVariants) {
        _selectedProductVariants = await _productService.getProductVariants(productId);
      } else {
        _selectedProductVariants = [];
      }
      
      _clearError();
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoadingProduct(false);
    }
  }

  // Search products
  Future<void> searchProducts(String query) async {
    _searchQuery = query;
    _setSearching(true);
    
    try {
      await loadProducts(search: query, refresh: true);
    } finally {
      _setSearching(false);
    }
  }



  Future<List<models.Product>> aiSearchByImage(File imageFile) async {
    try {
      return await _productService.aiSearchByImage(imageFile);
    } catch (e) {
      _setError(e.toString());
      return [];
    }
  }

  // Filter products
  Future<void> applyFilters({
    int? categoryId,
    int? brandId,
    double? minPrice,
    double? maxPrice,
    String? sortBy,
  }) async {
    _selectedCategoryId = categoryId;
    _selectedBrandId = brandId;
    _minPrice = minPrice;
    _maxPrice = maxPrice;
    _sortBy = sortBy;
    
    await loadProducts(
      search: _searchQuery.isNotEmpty ? _searchQuery : null,
      categoryId: categoryId,
      brandId: brandId,
      minPrice: minPrice,
      maxPrice: maxPrice,
      ordering: sortBy,
      refresh: true,
    );
  }

  // Clear filters
  Future<void> clearFilters() async {
    _selectedCategoryId = null;
    _selectedBrandId = null;
    _minPrice = null;
    _maxPrice = null;
    _sortBy = null;
    
    await loadProducts(
      search: _searchQuery.isNotEmpty ? _searchQuery : null,
      refresh: true,
    );
  }

  // Get products by category
  Future<void> loadProductsByCategory(int categoryId) async {
    _selectedCategoryId = categoryId;
    await loadProducts(categoryId: categoryId, refresh: true);
  }

  // Get products by brand
  Future<void> loadProductsByBrand(int brandId) async {
    _selectedBrandId = brandId;
    await loadProducts(brandId: brandId, refresh: true);
  }

  // Get related products
  Future<List<models.Product>> getRelatedProducts(models.Product product) async {
    try {
      return await _productService.getRelatedProducts(product);
    } catch (e) {
      debugPrint('Error loading related products: $e');
      return [];
    }
  }

  // Get product variant
  Future<models.ProductVariant?> getProductVariant(int productId, int colorId, int sizeId) async {
    try {
      return await _productService.getProductVariant(productId, colorId, sizeId);
    } catch (e) {
      debugPrint('Error loading product variant: $e');
      return null;
    }
  }

  // Utility methods
  models.Brand? getBrandById(int id) {
    try {
      return _brands.firstWhere((brand) => brand.id == id);
    } catch (e) {
      return null;
    }
  }

  models.Category? getCategoryById(int id) {
    try {
      return _categories.firstWhere((category) => category.id == id);
    } catch (e) {
      return null;
    }
  }

  models.Color? getColorById(int id) {
    try {
      return _colors.firstWhere((color) => color.id == id);
    } catch (e) {
      return null;
    }
  }

  models.Size? getSizeById(int id) {
    try {
      return _sizes.firstWhere((size) => size.id == id);
    } catch (e) {
      return null;
    }
  }

  // Check stock
  bool isProductInStock(models.Product product, {int? colorId, int? sizeId}) {
    return _productService.isProductInStock(product, colorId: colorId, sizeId: sizeId);
  }

  int getAvailableStock(models.Product product, {int? colorId, int? sizeId}) {
    return _productService.getAvailableStock(product, colorId: colorId, sizeId: sizeId);
  }

  // Sort options
  List<Map<String, String>> get sortOptions => [
    {'value': '', 'label': 'Default'},
    {'value': 'name', 'label': 'Name A-Z'},
    {'value': '-name', 'label': 'Name Z-A'},
    {'value': 'price', 'label': 'Price Low to High'},
    {'value': '-price', 'label': 'Price High to Low'},
    {'value': '-createdAt', 'label': 'Newest First'},
    {'value': 'createdAt', 'label': 'Oldest First'},
    {'value': '-total_sold', 'label': 'Best Selling'},
    {'value': '-rating', 'label': 'Highest Rated'},
  ];

  // Private methods
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setLoadingProduct(bool loading) {
    _isLoadingProduct = loading;
    notifyListeners();
  }

  void _setSearching(bool searching) {
    _isSearching = searching;
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

  // Clear selected product
  void clearSelectedProduct() {
    _selectedProduct = null;
    _selectedProductVariants = [];
    notifyListeners();
  }

  // Refresh data
  Future<void> refresh() async {
    // Only refresh if not already loading
    if (_isLoading) return;

    _setLoading(true);
    try {
      // Load basic data only if empty
      if (_brands.isEmpty || _categories.isEmpty) {
        await loadBasicData();
      }

      // Load featured products only if empty
      if (_featuredProducts.isEmpty) {
        await loadFeaturedProducts();
      }

      // Load new arrivals only if empty
      if (_newArrivals.isEmpty) {
        await loadNewArrivals();
      }

      // Load main products only if empty or has filters
      if (_products.isEmpty || _searchQuery.isNotEmpty || _selectedCategoryId != null || _selectedBrandId != null) {
        await loadProducts(
          search: _searchQuery.isNotEmpty ? _searchQuery : null,
          categoryId: _selectedCategoryId,
          brandId: _selectedBrandId,
          minPrice: _minPrice,
          maxPrice: _maxPrice,
          ordering: _sortBy,
          refresh: true,
        );
      }
    } finally {
      _setLoading(false);
    }
  }
}
