// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'product.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Brand _$BrandFromJson(Map<String, dynamic> json) => Brand(
  id: (json['id'] as num).toInt(),
  title: json['title'] as String,
  description: json['description'] as String?,
  featuredProduct: (json['featured_product'] as num?)?.toInt(),
  image: json['image'] as String?,
);

Map<String, dynamic> _$BrandToJson(Brand instance) => <String, dynamic>{
  'id': instance.id,
  'title': instance.title,
  'description': instance.description,
  'featured_product': instance.featuredProduct,
  'image': instance.image,
};

Category _$CategoryFromJson(Map<String, dynamic> json) => Category(
  id: (json['id'] as num).toInt(),
  title: json['title'] as String,
  description: json['description'] as String?,
  featuredProduct: (json['featured_product'] as num?)?.toInt(),
  image: json['image'] as String?,
);

Map<String, dynamic> _$CategoryToJson(Category instance) => <String, dynamic>{
  'id': instance.id,
  'title': instance.title,
  'description': instance.description,
  'featured_product': instance.featuredProduct,
  'image': instance.image,
};

Color _$ColorFromJson(Map<String, dynamic> json) => Color(
  id: (json['id'] as num).toInt(),
  name: json['name'] as String,
  hexCode: json['hex_code'] as String?,
);

Map<String, dynamic> _$ColorToJson(Color instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'hex_code': instance.hexCode,
};

Size _$SizeFromJson(Map<String, dynamic> json) =>
    Size(id: (json['id'] as num).toInt(), name: json['name'] as String);

Map<String, dynamic> _$SizeToJson(Size instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
};

ProductVariant _$ProductVariantFromJson(Map<String, dynamic> json) =>
    ProductVariant(
      id: (json['id'] as num).toInt(),
      product: (json['product'] as num).toInt(),
      color: Color.fromJson(json['color'] as Map<String, dynamic>),
      size: Size.fromJson(json['size'] as Map<String, dynamic>),
      price: (json['price'] as num).toDouble(),
      stockQuantity: (json['stock_quantity'] as num).toInt(),
      sku: json['sku'] as String?,
      image: json['image'] as String?,
    );

Map<String, dynamic> _$ProductVariantToJson(ProductVariant instance) =>
    <String, dynamic>{
      'id': instance.id,
      'product': instance.product,
      'color': instance.color,
      'size': instance.size,
      'price': instance.price,
      'stock_quantity': instance.stockQuantity,
      'sku': instance.sku,
      'image': instance.image,
    };

Product _$ProductFromJson(Map<String, dynamic> json) => Product(
  id: (json['id'] as num).toInt(),
  name: json['name'] as String,
  image: json['image'] as String?,
  brand: Brand.fromJson(json['brand'] as Map<String, dynamic>),
  category: Category.fromJson(json['category'] as Map<String, dynamic>),
  description: json['description'] as String?,
  rating: (json['rating'] as num?)?.toDouble(),
  numReviews: (json['numReviews'] as num).toInt(),
  price: (json['price'] as num).toDouble(),
  countInStock: (json['countInStock'] as num).toInt(),
  createdAt: json['createdAt'] as String,
  totalSold: (json['total_sold'] as num).toInt(),
  hasVariants: json['has_variants'] as bool,
  variants:
      (json['variants'] as List<dynamic>?)
          ?.map((e) => ProductVariant.fromJson(e as Map<String, dynamic>))
          .toList(),
);

Map<String, dynamic> _$ProductToJson(Product instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'image': instance.image,
  'brand': instance.brand,
  'category': instance.category,
  'description': instance.description,
  'rating': instance.rating,
  'numReviews': instance.numReviews,
  'price': instance.price,
  'countInStock': instance.countInStock,
  'createdAt': instance.createdAt,
  'total_sold': instance.totalSold,
  'has_variants': instance.hasVariants,
  'variants': instance.variants,
};
