import 'package:json_annotation/json_annotation.dart';

part 'product.g.dart';

@JsonSerializable()
class Brand {
  final int id;
  final String title;
  final String? description;
  @JsonKey(name: 'featured_product')
  final int? featuredProduct;
  final String? image;

  Brand({
    required this.id,
    required this.title,
    this.description,
    this.featuredProduct,
    this.image,
  });

  String get name => title; // Getter for compatibility

  factory Brand.fromJson(Map<String, dynamic> json) => _$BrandFromJson(json);
  Map<String, dynamic> toJson() => _$BrandToJson(this);
}

@JsonSerializable()
class Category {
  final int id;
  final String title;
  final String? description;
  @JsonKey(name: 'featured_product')
  final int? featuredProduct;
  final String? image;

  Category({
    required this.id,
    required this.title,
    this.description,
    this.featuredProduct,
    this.image,
  });

  String get name => title; // Getter for compatibility

  factory Category.fromJson(Map<String, dynamic> json) => _$CategoryFromJson(json);
  Map<String, dynamic> toJson() => _$CategoryToJson(this);
}

@JsonSerializable()
class Color {
  final int id;
  final String name;
  @JsonKey(name: 'hex_code')
  final String? hexCode;

  Color({
    required this.id,
    required this.name,
    this.hexCode,
  });

  factory Color.fromJson(Map<String, dynamic> json) => _$ColorFromJson(json);
  Map<String, dynamic> toJson() => _$ColorToJson(this);
}

@JsonSerializable()
class Size {
  final int id;
  final String name;

  Size({
    required this.id,
    required this.name,
  });

  factory Size.fromJson(Map<String, dynamic> json) => _$SizeFromJson(json);
  Map<String, dynamic> toJson() => _$SizeToJson(this);
}

@JsonSerializable()
class ProductVariant {
  final int id;
  final int product;
  final Color color;
  final Size size;
  final double price;
  @JsonKey(name: 'stock_quantity')
  final int stockQuantity;
  final String? sku;
  final String? image;

  ProductVariant({
    required this.id,
    required this.product,
    required this.color,
    required this.size,
    required this.price,
    required this.stockQuantity,
    this.sku,
    this.image,
  });

  factory ProductVariant.fromJson(Map<String, dynamic> json) => _$ProductVariantFromJson(json);
  Map<String, dynamic> toJson() => _$ProductVariantToJson(this);

  bool get isInStock => stockQuantity > 0;
}

@JsonSerializable()
class Product {
  final int id;
  final String name;
  final String? image;
  final Brand brand;
  final Category category;
  final String? description;
  final double? rating;
  @JsonKey(name: 'numReviews')
  final int numReviews;
  final double price;
  @JsonKey(name: 'countInStock')
  final int countInStock;
  @JsonKey(name: 'createdAt')
  final String createdAt;
  @JsonKey(name: 'total_sold')
  final int totalSold;
  @JsonKey(name: 'has_variants')
  final bool hasVariants;
  final List<ProductVariant>? variants;

  Product({
    required this.id,
    required this.name,
    this.image,
    required this.brand,
    required this.category,
    this.description,
    this.rating,
    required this.numReviews,
    required this.price,
    required this.countInStock,
    required this.createdAt,
    required this.totalSold,
    required this.hasVariants,
    this.variants,
  });

  factory Product.fromJson(Map<String, dynamic> json) => _$ProductFromJson(json);
  Map<String, dynamic> toJson() => _$ProductToJson(this);

  bool get isInStock => hasVariants 
    ? (variants?.any((v) => v.isInStock) ?? false)
    : countInStock > 0;

  double get minPriceCalculated => hasVariants
    ? (variants?.map((v) => v.price).reduce((a, b) => a < b ? a : b) ?? price)
    : price;

  double get maxPrice => hasVariants 
    ? (variants?.map((v) => v.price).reduce((a, b) => a > b ? a : b) ?? price)
    : price;

  int get totalStock => hasVariants
    ? (variants?.fold<int>(0, (sum, v) => sum + v.stockQuantity) ?? 0)
    : countInStock;

  List<Color> get availableColorsCalculated => hasVariants
    ? (variants?.map((v) => v.color).toSet().toList() ?? [])
    : [];

  List<Size> getSizesForColor(int colorId) {
    if (!hasVariants || variants == null) return [];
    return variants!
        .where((v) => v.color.id == colorId && v.isInStock)
        .map((v) => v.size)
        .toSet()
        .toList();
  }

  ProductVariant? getVariant(int colorId, int sizeId) {
    if (!hasVariants || variants == null) return null;
    try {
      return variants!.firstWhere(
        (v) => v.color.id == colorId && v.size.id == sizeId,
      );
    } catch (e) {
      return null;
    }
  }
}
