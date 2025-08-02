// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'paybox.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

PayboxWallet _$PayboxWalletFromJson(Map<String, dynamic> json) => PayboxWallet(
  id: (json['id'] as num).toInt(),
  user: User.fromJson(json['user'] as Map<String, dynamic>),
  balance: (json['balance'] as num).toDouble(),
  isActive: json['is_active'] as bool,
  createdAt: json['created_at'] as String,
  updatedAt: json['updated_at'] as String,
);

Map<String, dynamic> _$PayboxWalletToJson(PayboxWallet instance) =>
    <String, dynamic>{
      'id': instance.id,
      'user': instance.user,
      'balance': instance.balance,
      'is_active': instance.isActive,
      'created_at': instance.createdAt,
      'updated_at': instance.updatedAt,
    };

PayboxTransaction _$PayboxTransactionFromJson(Map<String, dynamic> json) =>
    PayboxTransaction(
      id: (json['id'] as num).toInt(),
      transactionType: json['transaction_type'] as String,
      amount: (json['amount'] as num).toDouble(),
      status: json['status'] as String,
      description: json['description'] as String?,
      order:
          json['order'] == null
              ? null
              : Order.fromJson(json['order'] as Map<String, dynamic>),
      stripePaymentIntentId: json['stripe_payment_intent_id'] as String?,
      balanceBefore: (json['balance_before'] as num).toDouble(),
      balanceAfter: (json['balance_after'] as num).toDouble(),
      createdAt: json['created_at'] as String,
    );

Map<String, dynamic> _$PayboxTransactionToJson(PayboxTransaction instance) =>
    <String, dynamic>{
      'id': instance.id,
      'transaction_type': instance.transactionType,
      'amount': instance.amount,
      'status': instance.status,
      'description': instance.description,
      'order': instance.order,
      'stripe_payment_intent_id': instance.stripePaymentIntentId,
      'balance_before': instance.balanceBefore,
      'balance_after': instance.balanceAfter,
      'created_at': instance.createdAt,
    };

PayboxDepositRequest _$PayboxDepositRequestFromJson(
  Map<String, dynamic> json,
) => PayboxDepositRequest(
  amount: (json['amount'] as num).toDouble(),
  paymentMethod: json['payment_method'] as String,
);

Map<String, dynamic> _$PayboxDepositRequestToJson(
  PayboxDepositRequest instance,
) => <String, dynamic>{
  'amount': instance.amount,
  'payment_method': instance.paymentMethod,
};

PayboxDepositResponse _$PayboxDepositResponseFromJson(
  Map<String, dynamic> json,
) => PayboxDepositResponse(
  clientSecret: json['client_secret'] as String,
  transactionId: (json['transaction_id'] as num).toInt(),
  status: json['status'] as String,
);

Map<String, dynamic> _$PayboxDepositResponseToJson(
  PayboxDepositResponse instance,
) => <String, dynamic>{
  'client_secret': instance.clientSecret,
  'transaction_id': instance.transactionId,
  'status': instance.status,
};

PayboxPaymentRequest _$PayboxPaymentRequestFromJson(
  Map<String, dynamic> json,
) => PayboxPaymentRequest(
  orderId: (json['order_id'] as num).toInt(),
  amount: (json['amount'] as num).toDouble(),
);

Map<String, dynamic> _$PayboxPaymentRequestToJson(
  PayboxPaymentRequest instance,
) => <String, dynamic>{'order_id': instance.orderId, 'amount': instance.amount};

PayboxPaymentResponse _$PayboxPaymentResponseFromJson(
  Map<String, dynamic> json,
) => PayboxPaymentResponse(
  status: json['status'] as String,
  message: json['message'] as String,
  transactionId: (json['transaction_id'] as num?)?.toInt(),
  newBalance: (json['new_balance'] as num?)?.toDouble(),
);

Map<String, dynamic> _$PayboxPaymentResponseToJson(
  PayboxPaymentResponse instance,
) => <String, dynamic>{
  'status': instance.status,
  'message': instance.message,
  'transaction_id': instance.transactionId,
  'new_balance': instance.newBalance,
};
