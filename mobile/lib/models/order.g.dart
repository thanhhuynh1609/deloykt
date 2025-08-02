// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'order.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

OrderItem _$OrderItemFromJson(Map<String, dynamic> json) => OrderItem(
  id: (json['id'] as num?)?.toInt(),
  product:
      json['product'] == null
          ? null
          : Product.fromJson(json['product'] as Map<String, dynamic>),
  productVariant:
      json['product_variant'] == null
          ? null
          : ProductVariant.fromJson(
            json['product_variant'] as Map<String, dynamic>,
          ),
  productName: json['productName'] as String,
  qty: (json['qty'] as num).toInt(),
  price: (json['price'] as num).toDouble(),
  image: json['image'] as String?,
  colorName: json['color_name'] as String?,
  sizeName: json['size_name'] as String?,
);

Map<String, dynamic> _$OrderItemToJson(OrderItem instance) => <String, dynamic>{
  'id': instance.id,
  'product': instance.product,
  'product_variant': instance.productVariant,
  'productName': instance.productName,
  'qty': instance.qty,
  'price': instance.price,
  'image': instance.image,
  'color_name': instance.colorName,
  'size_name': instance.sizeName,
};

Order _$OrderFromJson(Map<String, dynamic> json) => Order(
  id: (json['id'] as num).toInt(),
  user:
      json['user'] == null
          ? null
          : User.fromJson(json['user'] as Map<String, dynamic>),
  taxPrice: (json['taxPrice'] as num).toDouble(),
  shippingPrice: (json['shippingPrice'] as num).toDouble(),
  totalPrice: (json['totalPrice'] as num).toDouble(),
  paymentMethod: json['paymentMethod'] as String?,
  isPaid: json['isPaid'] as bool,
  isDelivered: json['isDelivered'] as bool,
  isRefunded: json['isRefunded'] as bool,
  createdAt: json['createdAt'] as String,
  paidAt: json['paidAt'] as String?,
  deliveredAt: json['deliveredAt'] as String?,
  shippingAddress:
      json['shippingAddress'] == null
          ? null
          : ShippingAddress.fromJson(
            json['shippingAddress'] as Map<String, dynamic>,
          ),
  orderItems:
      (json['orderItems'] as List<dynamic>?)
          ?.map((e) => OrderItem.fromJson(e as Map<String, dynamic>))
          .toList(),
);

Map<String, dynamic> _$OrderToJson(Order instance) => <String, dynamic>{
  'id': instance.id,
  'user': instance.user,
  'taxPrice': instance.taxPrice,
  'shippingPrice': instance.shippingPrice,
  'totalPrice': instance.totalPrice,
  'paymentMethod': instance.paymentMethod,
  'isPaid': instance.isPaid,
  'isDelivered': instance.isDelivered,
  'isRefunded': instance.isRefunded,
  'createdAt': instance.createdAt,
  'paidAt': instance.paidAt,
  'deliveredAt': instance.deliveredAt,
  'shippingAddress': instance.shippingAddress,
  'orderItems': instance.orderItems,
};

PlaceOrderRequest _$PlaceOrderRequestFromJson(Map<String, dynamic> json) =>
    PlaceOrderRequest(
      orderItems:
          (json['orderItems'] as List<dynamic>)
              .map((e) => OrderItem.fromJson(e as Map<String, dynamic>))
              .toList(),
      shippingAddress: ShippingAddress.fromJson(
        json['shippingAddress'] as Map<String, dynamic>,
      ),
      paymentMethod: json['paymentMethod'] as String,
      itemsPrice: (json['itemsPrice'] as num).toDouble(),
      taxPrice: (json['taxPrice'] as num).toDouble(),
      shippingPrice: (json['shippingPrice'] as num).toDouble(),
      totalPrice: (json['totalPrice'] as num).toDouble(),
      couponCode: json['couponCode'] as String?,
    );

Map<String, dynamic> _$PlaceOrderRequestToJson(PlaceOrderRequest instance) =>
    <String, dynamic>{
      'orderItems': instance.orderItems,
      'shippingAddress': instance.shippingAddress,
      'paymentMethod': instance.paymentMethod,
      'itemsPrice': instance.itemsPrice,
      'taxPrice': instance.taxPrice,
      'shippingPrice': instance.shippingPrice,
      'totalPrice': instance.totalPrice,
      'couponCode': instance.couponCode,
    };
