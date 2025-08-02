import 'package:json_annotation/json_annotation.dart';
import 'user.dart';
import 'order.dart';

part 'paybox.g.dart';

@JsonSerializable()
class PayboxWallet {
  final int id;
  final User user;
  final double balance;
  @JsonKey(name: 'is_active')
  final bool isActive;
  @JsonKey(name: 'created_at')
  final String createdAt;
  @JsonKey(name: 'updated_at')
  final String updatedAt;

  PayboxWallet({
    required this.id,
    required this.user,
    required this.balance,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });

  factory PayboxWallet.fromJson(Map<String, dynamic> json) => _$PayboxWalletFromJson(json);
  Map<String, dynamic> toJson() => _$PayboxWalletToJson(this);

  String get formattedBalance {
    return '${balance.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.',
    )} VND';
  }

  bool hasSufficientBalance(double amount) {
    return isActive && balance >= amount;
  }

  DateTime get createdDate => DateTime.parse(createdAt);
  DateTime get updatedDate => DateTime.parse(updatedAt);
}

@JsonSerializable()
class PayboxTransaction {
  final int id;
  @JsonKey(name: 'transaction_type')
  final String transactionType;
  final double amount;
  final String status;
  final String? description;
  final Order? order;
  @JsonKey(name: 'stripe_payment_intent_id')
  final String? stripePaymentIntentId;
  @JsonKey(name: 'balance_before')
  final double balanceBefore;
  @JsonKey(name: 'balance_after')
  final double balanceAfter;
  @JsonKey(name: 'created_at')
  final String createdAt;

  PayboxTransaction({
    required this.id,
    required this.transactionType,
    required this.amount,
    required this.status,
    this.description,
    this.order,
    this.stripePaymentIntentId,
    required this.balanceBefore,
    required this.balanceAfter,
    required this.createdAt,
  });

  factory PayboxTransaction.fromJson(Map<String, dynamic> json) => _$PayboxTransactionFromJson(json);
  Map<String, dynamic> toJson() => _$PayboxTransactionToJson(this);

  String get formattedAmount {
    return '${amount.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.',
    )} VND';
  }

  String get typeDisplayName {
    switch (transactionType) {
      case 'DEPOSIT':
        return 'Nạp tiền';
      case 'PAYMENT':
        return 'Thanh toán';
      case 'REFUND':
        return 'Hoàn tiền';
      default:
        return transactionType;
    }
  }

  String get statusDisplayName {
    switch (status) {
      case 'PENDING':
        return 'Đang xử lý';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'FAILED':
        return 'Thất bại';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  }

  String get statusColor {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'FAILED':
      case 'CANCELLED':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  bool get isDeposit => transactionType == 'DEPOSIT';
  bool get isPayment => transactionType == 'PAYMENT';
  bool get isRefund => transactionType == 'REFUND';

  bool get isCompleted => status == 'COMPLETED';
  bool get isPending => status == 'PENDING';
  bool get isFailed => status == 'FAILED';
  bool get isCancelled => status == 'CANCELLED';

  DateTime get createdDate => DateTime.parse(createdAt);
}

@JsonSerializable()
class PayboxDepositRequest {
  final double amount;
  @JsonKey(name: 'payment_method')
  final String paymentMethod;

  PayboxDepositRequest({
    required this.amount,
    required this.paymentMethod,
  });

  factory PayboxDepositRequest.fromJson(Map<String, dynamic> json) => _$PayboxDepositRequestFromJson(json);
  Map<String, dynamic> toJson() => _$PayboxDepositRequestToJson(this);
}

@JsonSerializable()
class PayboxDepositResponse {
  @JsonKey(name: 'client_secret')
  final String clientSecret;
  @JsonKey(name: 'transaction_id')
  final int transactionId;
  final String status;

  PayboxDepositResponse({
    required this.clientSecret,
    required this.transactionId,
    required this.status,
  });

  factory PayboxDepositResponse.fromJson(Map<String, dynamic> json) => _$PayboxDepositResponseFromJson(json);
  Map<String, dynamic> toJson() => _$PayboxDepositResponseToJson(this);
}

@JsonSerializable()
class PayboxPaymentRequest {
  @JsonKey(name: 'order_id')
  final int orderId;
  final double amount;

  PayboxPaymentRequest({
    required this.orderId,
    required this.amount,
  });

  factory PayboxPaymentRequest.fromJson(Map<String, dynamic> json) => _$PayboxPaymentRequestFromJson(json);
  Map<String, dynamic> toJson() => _$PayboxPaymentRequestToJson(this);
}

@JsonSerializable()
class PayboxPaymentResponse {
  final String status;
  final String message;
  @JsonKey(name: 'transaction_id')
  final int? transactionId;
  @JsonKey(name: 'new_balance')
  final double? newBalance;

  PayboxPaymentResponse({
    required this.status,
    required this.message,
    this.transactionId,
    this.newBalance,
  });

  factory PayboxPaymentResponse.fromJson(Map<String, dynamic> json) => _$PayboxPaymentResponseFromJson(json);
  Map<String, dynamic> toJson() => _$PayboxPaymentResponseToJson(this);

  bool get isSuccess => status == 'success';
}
