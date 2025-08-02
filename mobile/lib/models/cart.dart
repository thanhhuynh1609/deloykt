import 'package:json_annotation/json_annotation.dart';
import 'product.dart';

part 'cart.g.dart';

@JsonSerializable()
class CartItem {
  final int id; // Product ID
  final int qty;
  @JsonKey(name: 'variant_id')
  final int? variantId;
  final String? color;
  final String? size;
  
  // These fields are populated when fetching cart details
  final Product? product;
  final ProductVariant? variant;
  final double? price;
  final String? image;
  final String? name;

  CartItem({
    required this.id,
    required this.qty,
    this.variantId,
    this.color,
    this.size,
    this.product,
    this.variant,
    this.price,
    this.image,
    this.name,
  });

  factory CartItem.fromJson(Map<String, dynamic> json) => _$CartItemFromJson(json);
  Map<String, dynamic> toJson() => _$CartItemToJson(this);

  double get itemPrice {
    if (price != null) return price!;
    if (variant != null) return variant!.price;
    if (product != null) return product!.price;
    return 0.0;
  }

  String get itemName {
    if (name != null) return name!;
    if (product != null) return product!.name;
    return 'Unknown Product';
  }

  String get itemImage {
    if (image != null) return image!;
    if (variant?.image != null) return variant!.image!;
    if (product?.image != null) return product!.image!;
    return '';
  }

  double get totalPrice => itemPrice * qty;

  String get variantDescription {
    if (color != null && size != null) {
      return '$color - $size';
    } else if (color != null) {
      return color!;
    } else if (size != null) {
      return size!;
    }
    return '';
  }

  bool get hasVariant => variantId != null;

  CartItem copyWith({
    int? id,
    int? qty,
    int? variantId,
    String? color,
    String? size,
    Product? product,
    ProductVariant? variant,
    double? price,
    String? image,
    String? name,
  }) {
    return CartItem(
      id: id ?? this.id,
      qty: qty ?? this.qty,
      variantId: variantId ?? this.variantId,
      color: color ?? this.color,
      size: size ?? this.size,
      product: product ?? this.product,
      variant: variant ?? this.variant,
      price: price ?? this.price,
      image: image ?? this.image,
      name: name ?? this.name,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is CartItem &&
        other.id == id &&
        other.variantId == variantId;
  }

  @override
  int get hashCode => id.hashCode ^ variantId.hashCode;
}

@JsonSerializable()
class ShippingAddress {
  final String address;
  final String city;
  @JsonKey(name: 'postal_code')
  final String postalCode;
  final String country;

  ShippingAddress({
    required this.address,
    required this.city,
    required this.postalCode,
    required this.country,
  });

  factory ShippingAddress.fromJson(Map<String, dynamic> json) => _$ShippingAddressFromJson(json);
  Map<String, dynamic> toJson() => _$ShippingAddressToJson(this);

  String get fullAddress => '$address, $city, $postalCode, $country';

  ShippingAddress copyWith({
    String? address,
    String? city,
    String? postalCode,
    String? country,
  }) {
    return ShippingAddress(
      address: address ?? this.address,
      city: city ?? this.city,
      postalCode: postalCode ?? this.postalCode,
      country: country ?? this.country,
    );
  }
}

class Cart {
  final List<CartItem> items;
  final ShippingAddress? shippingAddress;
  final String paymentMethod;
  final String? couponCode;
  final double discountAmount;

  Cart({
    required this.items,
    this.shippingAddress,
    required this.paymentMethod,
    this.couponCode,
    this.discountAmount = 0.0,
  });

  double get itemsPrice {
    return items.fold(0.0, (sum, item) => sum + item.totalPrice);
  }

  double get shippingPrice {
    // Free shipping for orders over 500,000 VND
    return itemsPrice > 500000 ? 0.0 : 50000;
  }

  double get taxPrice {
    return itemsPrice * 0.1; // 10% tax
  }

  double get totalPrice {
    return itemsPrice + shippingPrice + taxPrice - discountAmount;
  }

  int get totalItems {
    return items.fold(0, (sum, item) => sum + item.qty);
  }

  bool get isEmpty => items.isEmpty;

  bool get isNotEmpty => items.isNotEmpty;

  Cart copyWith({
    List<CartItem>? items,
    ShippingAddress? shippingAddress,
    String? paymentMethod,
    String? couponCode,
    double? discountAmount,
  }) {
    return Cart(
      items: items ?? this.items,
      shippingAddress: shippingAddress ?? this.shippingAddress,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      couponCode: couponCode ?? this.couponCode,
      discountAmount: discountAmount ?? this.discountAmount,
    );
  }
}
