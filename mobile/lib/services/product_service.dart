import 'dart:io';
import 'package:flutter/foundation.dart' show debugPrint;
import '../constants/api_constants.dart';
import '../models/product.dart';
import 'api_service.dart';
import 'product_adapter.dart';

class ProductService {
  final ApiService _apiService = ApiService();

  // Cache for brands and categories
  List<Brand>? _cachedBrands;
  List<Category>? _cachedCategories;

  /// Get all products with optional filters
  Future<List<Product>> getProducts({
    String? search,
    int? categoryId,
    int? brandId,
    double? minPrice,
    double? maxPrice,
    String? ordering,
    int? page,
    int? pageSize,
  }) async {
    // Ensure we have brands and categories cached
    await _ensureBrandsAndCategoriesCached();

    final queryParams = <String, dynamic>{};

    if (search != null && search.isNotEmpty) queryParams['search'] = search;
    if (categoryId != null) queryParams['category'] = categoryId;
    if (brandId != null) queryParams['brand'] = brandId;
    if (minPrice != null) queryParams['min_price'] = minPrice;
    if (maxPrice != null) queryParams['max_price'] = maxPrice;
    if (ordering != null) queryParams['ordering'] = ordering;
    if (page != null) queryParams['page'] = page;
    if (pageSize != null) queryParams['page_size'] = pageSize;

    final response = await _apiService.get(
      ApiConstants.products,
      queryParameters: queryParams,
    );

    // Use adapter to handle API response format
    final wrapper = ProductResponseWrapper.fromJson(
      response.data,
      brands: _cachedBrands,
      categories: _cachedCategories,
    );

    return wrapper.products;
  }

  /// Ensure brands and categories are cached
  Future<void> _ensureBrandsAndCategoriesCached() async {
    if (_cachedBrands == null || _cachedCategories == null) {
      debugPrint('ProductService: Loading brands and categories for cache');
      try {
        final results = await Future.wait([
          getBrands(),
          getCategories(),
        ]);
        _cachedBrands = results[0] as List<Brand>;
        _cachedCategories = results[1] as List<Category>;
        debugPrint('ProductService: Cached ${_cachedBrands?.length} brands and ${_cachedCategories?.length} categories');
      } catch (e) {
        debugPrint('ProductService: Error caching brands/categories: $e');
        // Set empty lists to prevent infinite retry
        _cachedBrands = [];
        _cachedCategories = [];
      }
    }
  }

  /// Get product by ID
  Future<Product> getProduct(int id) async {
    await _ensureBrandsAndCategoriesCached();

    final response = await _apiService.get('${ApiConstants.products}$id/');
    return ProductAdapter.fromApiResponse(
      response.data,
      brands: _cachedBrands,
      categories: _cachedCategories,
    );
  }

  /// Get product variant
  Future<ProductVariant?> getProductVariant(int productId, int colorId, int sizeId) async {
    try {
      final response = await _apiService.get(
        ApiConstants.getProductVariantUrl(productId, colorId, sizeId),
      );
      return ProductVariant.fromJson(response.data);
    } catch (e) {
      return null;
    }
  }

  /// Get all brands
  Future<List<Brand>> getBrands() async {
    final response = await _apiService.get(ApiConstants.brands);
    final List<dynamic> data = response.data;
    return data.map((json) => Brand.fromJson(json)).toList();
  }

  /// Get all categories
  Future<List<Category>> getCategories() async {
    final response = await _apiService.get(ApiConstants.categories);
    final List<dynamic> data = response.data;
    return data.map((json) => Category.fromJson(json)).toList();
  }

  /// Get all colors
  Future<List<Color>> getColors() async {
    final response = await _apiService.get(ApiConstants.colors);
    final List<dynamic> data = response.data;
    return data.map((json) => Color.fromJson(json)).toList();
  }

  /// Get all sizes
  Future<List<Size>> getSizes() async {
    final response = await _apiService.get(ApiConstants.sizes);
    final List<dynamic> data = response.data;
    return data.map((json) => Size.fromJson(json)).toList();
  }

  /// Get product variants for a specific product
  Future<List<ProductVariant>> getProductVariants(int productId) async {
    final response = await _apiService.get(
      ApiConstants.productVariants,
      queryParameters: {'product': productId},
    );
    final List<dynamic> data = response.data;
    return data.map((json) => ProductVariant.fromJson(json)).toList();
  }

  /// Search products with AI
  Future<List<Product>> aiSearchByText(String query, {int limit = 5}) async {
    final response = await _apiService.post(
      ApiConstants.aiSearchText,
      data: {
        'text': query,
        'limit': limit,
      },
    );

    final List<dynamic> products = response.data['products'];
    return products.map((json) => Product.fromJson(json)).toList();
  }

  /// Search products by image
  Future<List<Product>> aiSearchByImage(File imageFile, {int limit = 5}) async {
    final response = await _apiService.uploadFile(
      ApiConstants.aiSearchImage,
      imageFile,
      fieldName: 'image',
      data: {'limit': limit},
    );

    final List<dynamic> products = response.data['products'];
    return products.map((json) => Product.fromJson(json)).toList();
  }

  /// Combined AI search (text + image)
  Future<List<Product>> aiSearchCombined({
    String? text,
    File? imageFile,
    int limit = 5,
  }) async {
    if (text == null && imageFile == null) {
      throw ArgumentError('Either text or imageFile must be provided');
    }

    final data = <String, dynamic>{'limit': limit};
    if (text != null) data['text'] = text;

    if (imageFile != null) {
      final response = await _apiService.uploadFile(
        ApiConstants.aiSearchCombined,
        imageFile,
        fieldName: 'image',
        data: data,
      );
      final List<dynamic> products = response.data['products'];
      return products.map((json) => Product.fromJson(json)).toList();
    } else {
      final response = await _apiService.post(
        ApiConstants.aiSearchCombined,
        data: data,
      );
      final List<dynamic> products = response.data['products'];
      return products.map((json) => Product.fromJson(json)).toList();
    }
  }

  /// Get featured/recommended products
  Future<List<Product>> getFeaturedProducts({int limit = 10}) async {
    return await getProducts(
      ordering: '-total_sold',
      pageSize: limit,
    );
  }

  /// Get new arrivals
  Future<List<Product>> getNewArrivals({int limit = 10}) async {
    return await getProducts(
      ordering: '-createdAt',
      pageSize: limit,
    );
  }

  /// Get products by category
  Future<List<Product>> getProductsByCategory(int categoryId, {
    int? page,
    int? pageSize,
    String? ordering,
  }) async {
    return await getProducts(
      categoryId: categoryId,
      page: page,
      pageSize: pageSize,
      ordering: ordering,
    );
  }

  /// Get products by brand
  Future<List<Product>> getProductsByBrand(int brandId, {
    int? page,
    int? pageSize,
    String? ordering,
  }) async {
    return await getProducts(
      brandId: brandId,
      page: page,
      pageSize: pageSize,
      ordering: ordering,
    );
  }

  /// Get related products (same category, different product)
  Future<List<Product>> getRelatedProducts(Product product, {int limit = 5}) async {
    final products = await getProducts(
      categoryId: product.category.id,
      pageSize: limit + 1, // Get one extra to exclude current product
    );
    
    // Remove current product from results
    return products.where((p) => p.id != product.id).take(limit).toList();
  }

  /// Check if product is in stock
  bool isProductInStock(Product product, {int? colorId, int? sizeId}) {
    if (!product.hasVariants) {
      return product.countInStock > 0;
    }
    
    if (colorId != null && sizeId != null) {
      final variant = product.getVariant(colorId, sizeId);
      return variant?.isInStock ?? false;
    }
    
    return product.isInStock;
  }

  /// Get available stock for product variant
  int getAvailableStock(Product product, {int? colorId, int? sizeId}) {
    if (!product.hasVariants) {
      return product.countInStock;
    }
    
    if (colorId != null && sizeId != null) {
      final variant = product.getVariant(colorId, sizeId);
      return variant?.stockQuantity ?? 0;
    }
    
    return product.totalStock;
  }
}
