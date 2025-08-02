import '../models/product.dart';

class ProductAdapter {
  static Product fromApiResponse(Map<String, dynamic> json, {
    List<Brand>? brands,
    List<Category>? categories,
  }) {
    // Get brand and category objects from IDs
    Brand? brandObj;
    Category? categoryObj;
    
    if (brands != null && json['brand'] is int) {
      try {
        brandObj = brands.firstWhere((b) => b.id == json['brand']);
      } catch (e) {
        // Create a default brand if not found
        brandObj = Brand(
          id: json['brand'] as int,
          title: 'Unknown Brand',
        );
      }
    }
    
    if (categories != null && json['category'] is int) {
      try {
        categoryObj = categories.firstWhere((c) => c.id == json['category']);
      } catch (e) {
        // Create a default category if not found
        categoryObj = Category(
          id: json['category'] as int,
          title: 'Unknown Category',
        );
      }
    }
    
    // Create modified JSON with brand and category objects
    final modifiedJson = Map<String, dynamic>.from(json);
    
    if (brandObj != null) {
      modifiedJson['brand'] = brandObj.toJson();
    }
    
    if (categoryObj != null) {
      modifiedJson['category'] = categoryObj.toJson();
    }
    
    // Handle missing fields with defaults
    modifiedJson['numReviews'] = json['numReviews'] ?? 0;
    modifiedJson['createdAt'] = json['createdAt'] ?? DateTime.now().toIso8601String();
    modifiedJson['total_sold'] = json['total_sold'] ?? 0;
    modifiedJson['has_variants'] = json['has_variants'] ?? false;

    // Handle price conversion from string to double
    if (json['price'] is String) {
      modifiedJson['price'] = double.tryParse(json['price']) ?? 0.0;
    }

    // Handle rating conversion
    if (json['rating'] is String) {
      modifiedJson['rating'] = double.tryParse(json['rating']);
    }
    
    return Product.fromJson(modifiedJson);
  }
  
  static List<Product> fromApiResponseList(
    List<dynamic> jsonList, {
    List<Brand>? brands,
    List<Category>? categories,
  }) {
    return jsonList.map((json) => fromApiResponse(
      json as Map<String, dynamic>,
      brands: brands,
      categories: categories,
    )).toList();
  }
}

class ProductResponseWrapper {
  final List<Product> products;
  final int? count;
  final String? next;
  final String? previous;
  
  ProductResponseWrapper({
    required this.products,
    this.count,
    this.next,
    this.previous,
  });
  
  factory ProductResponseWrapper.fromJson(
    dynamic json, {
    List<Brand>? brands,
    List<Category>? categories,
  }) {
    // Handle both paginated and non-paginated responses
    if (json is Map<String, dynamic> && json.containsKey('results')) {
      // Paginated response
      return ProductResponseWrapper(
        products: ProductAdapter.fromApiResponseList(
          json['results'] as List<dynamic>,
          brands: brands,
          categories: categories,
        ),
        count: json['count'] as int?,
        next: json['next'] as String?,
        previous: json['previous'] as String?,
      );
    } else if (json is List) {
      // Direct list response
      return ProductResponseWrapper(
        products: ProductAdapter.fromApiResponseList(
          json,
          brands: brands,
          categories: categories,
        ),
      );
    } else if (json is Map<String, dynamic>) {
      // Single product response wrapped in list
      return ProductResponseWrapper(
        products: [ProductAdapter.fromApiResponse(
          json,
          brands: brands,
          categories: categories,
        )],
      );
    } else {
      throw Exception('Unexpected response format: ${json.runtimeType}');
    }
  }
}
