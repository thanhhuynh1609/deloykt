import 'package:json_annotation/json_annotation.dart';
import 'product.dart';
import 'cart.dart';
import 'user.dart';

part 'order.g.dart';

@JsonSerializable()
class OrderItem {
  final int? id;
  final Product? product;
  @JsonKey(name: 'product_variant')
  final ProductVariant? productVariant;
  @JsonKey(name: 'productName')
  final String productName;
  final int qty;
  final double price;
  final String? image;
  @JsonKey(name: 'color_name')
  final String? colorName;
  @JsonKey(name: 'size_name')
  final String? sizeName;

  OrderItem({
    this.id,
    this.product,
    this.productVariant,
    required this.productName,
    required this.qty,
    required this.price,
    this.image,
    this.colorName,
    this.sizeName,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) => _$OrderItemFromJson(json);
  Map<String, dynamic> toJson() => _$OrderItemToJson(this);

  double get totalPrice => price * qty;

  String get variantDescription {
    if (colorName != null && sizeName != null) {
      return '$colorName - $sizeName';
    } else if (colorName != null) {
      return colorName!;
    } else if (sizeName != null) {
      return sizeName!;
    }
    return '';
  }

  bool get hasVariant => colorName != null || sizeName != null;

  // Create OrderItem from CartItem
  factory OrderItem.fromCartItem(CartItem cartItem) {
    return OrderItem(
      productName: cartItem.itemName,
      qty: cartItem.qty,
      price: cartItem.itemPrice,
      image: cartItem.itemImage.isNotEmpty ? cartItem.itemImage : null,
      colorName: cartItem.color,
      sizeName: cartItem.size,
    );
  }
}

@JsonSerializable()
class Order {
  final int id;
  final User? user;
  @JsonKey(name: 'taxPrice')
  final double taxPrice;
  @JsonKey(name: 'shippingPrice')
  final double shippingPrice;
  @JsonKey(name: 'totalPrice')
  final double totalPrice;
  @JsonKey(name: 'paymentMethod')
  final String? paymentMethod;
  @JsonKey(name: 'isPaid')
  final bool isPaid;
  @JsonKey(name: 'isDelivered')
  final bool isDelivered;
  @JsonKey(name: 'isRefunded')
  final bool isRefunded;
  @JsonKey(name: 'createdAt')
  final String createdAt;
  @JsonKey(name: 'paidAt')
  final String? paidAt;
  @JsonKey(name: 'deliveredAt')
  final String? deliveredAt;
  @JsonKey(name: 'shippingAddress')
  final ShippingAddress? shippingAddress;
  @JsonKey(name: 'orderItems')
  final List<OrderItem>? orderItems;

  Order({
    required this.id,
    this.user,
    required this.taxPrice,
    required this.shippingPrice,
    required this.totalPrice,
    this.paymentMethod,
    required this.isPaid,
    required this.isDelivered,
    required this.isRefunded,
    required this.createdAt,
    this.paidAt,
    this.deliveredAt,
    this.shippingAddress,
    this.orderItems,
  });

  factory Order.fromJson(Map<String, dynamic> json) => _$OrderFromJson(json);
  Map<String, dynamic> toJson() => _$OrderToJson(this);

  String get status {
    if (isRefunded) return 'Đã hoàn tiền';
    if (isDelivered) return 'Đã giao hàng';
    if (isPaid) return 'Đã thanh toán';
    return 'Chờ thanh toán';
  }

  String get statusColor {
    if (isRefunded) return 'warning';
    if (isDelivered) return 'success';
    if (isPaid) return 'info';
    return 'danger';
  }

  double get itemsPrice => totalPrice - taxPrice - shippingPrice;

  int get totalItems {
    return orderItems?.fold<int>(0, (sum, item) => sum + item.qty) ?? 0;
  }

  DateTime get createdDate => DateTime.parse(createdAt);
  DateTime? get paidDate => paidAt != null ? DateTime.parse(paidAt!) : null;
  DateTime? get deliveredDate => deliveredAt != null ? DateTime.parse(deliveredAt!) : null;

  bool get canBeCancelled => !isPaid && !isDelivered && !isRefunded;
  bool get canBeRefunded => isPaid && !isRefunded;
}

@JsonSerializable()
class PlaceOrderRequest {
  @JsonKey(name: 'orderItems')
  final List<OrderItem> orderItems;
  @JsonKey(name: 'shippingAddress')
  final ShippingAddress shippingAddress;
  @JsonKey(name: 'paymentMethod')
  final String paymentMethod;
  @JsonKey(name: 'itemsPrice')
  final double itemsPrice;
  @JsonKey(name: 'taxPrice')
  final double taxPrice;
  @JsonKey(name: 'shippingPrice')
  final double shippingPrice;
  @JsonKey(name: 'totalPrice')
  final double totalPrice;
  @JsonKey(name: 'couponCode')
  final String? couponCode;

  PlaceOrderRequest({
    required this.orderItems,
    required this.shippingAddress,
    required this.paymentMethod,
    required this.itemsPrice,
    required this.taxPrice,
    required this.shippingPrice,
    required this.totalPrice,
    this.couponCode,
  });

  factory PlaceOrderRequest.fromJson(Map<String, dynamic> json) => _$PlaceOrderRequestFromJson(json);
  Map<String, dynamic> toJson() => _$PlaceOrderRequestToJson(this);

  // Create PlaceOrderRequest from Cart
  factory PlaceOrderRequest.fromCart(Cart cart) {
    return PlaceOrderRequest(
      orderItems: cart.items.map((item) => OrderItem.fromCartItem(item)).toList(),
      shippingAddress: cart.shippingAddress!,
      paymentMethod: cart.paymentMethod,
      itemsPrice: cart.itemsPrice,
      taxPrice: cart.taxPrice,
      shippingPrice: cart.shippingPrice,
      totalPrice: cart.totalPrice,
      couponCode: cart.couponCode,
    );
  }
}
