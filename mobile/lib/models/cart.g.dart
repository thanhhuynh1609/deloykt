// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'cart.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

CartItem _$CartItemFromJson(Map<String, dynamic> json) => CartItem(
  id: (json['id'] as num).toInt(),
  qty: (json['qty'] as num).toInt(),
  variantId: (json['variant_id'] as num?)?.toInt(),
  color: json['color'] as String?,
  size: json['size'] as String?,
  product:
      json['product'] == null
          ? null
          : Product.fromJson(json['product'] as Map<String, dynamic>),
  variant:
      json['variant'] == null
          ? null
          : ProductVariant.fromJson(json['variant'] as Map<String, dynamic>),
  price: (json['price'] as num?)?.toDouble(),
  image: json['image'] as String?,
  name: json['name'] as String?,
);

Map<String, dynamic> _$CartItemToJson(CartItem instance) => <String, dynamic>{
  'id': instance.id,
  'qty': instance.qty,
  'variant_id': instance.variantId,
  'color': instance.color,
  'size': instance.size,
  'product': instance.product,
  'variant': instance.variant,
  'price': instance.price,
  'image': instance.image,
  'name': instance.name,
};

ShippingAddress _$ShippingAddressFromJson(Map<String, dynamic> json) =>
    ShippingAddress(
      address: json['address'] as String,
      city: json['city'] as String,
      postalCode: json['postal_code'] as String,
      country: json['country'] as String,
    );

Map<String, dynamic> _$ShippingAddressToJson(ShippingAddress instance) =>
    <String, dynamic>{
      'address': instance.address,
      'city': instance.city,
      'postal_code': instance.postalCode,
      'country': instance.country,
    };
