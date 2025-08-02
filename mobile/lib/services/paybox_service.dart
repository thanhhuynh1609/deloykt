import '../constants/api_constants.dart';
import '../models/paybox.dart';
import 'api_service.dart';

class PayboxService {
  final ApiService _apiService = ApiService();

  /// Get user's paybox wallet
  Future<PayboxWallet> getWallet() async {
    final response = await _apiService.get(ApiConstants.payboxWallet);
    return PayboxWallet.fromJson(response.data);
  }

  /// Get wallet transactions
  Future<List<PayboxTransaction>> getTransactions({
    int? page,
    int? pageSize,
    String? transactionType,
    String? status,
  }) async {
    final queryParams = <String, dynamic>{};
    
    if (page != null) queryParams['page'] = page;
    if (pageSize != null) queryParams['page_size'] = pageSize;
    if (transactionType != null) queryParams['transaction_type'] = transactionType;
    if (status != null) queryParams['status'] = status;

    final response = await _apiService.get(
      ApiConstants.payboxTransactions,
      queryParameters: queryParams,
    );

    // Handle both paginated and non-paginated responses
    final data = response.data;
    if (data is Map<String, dynamic> && data.containsKey('results')) {
      // Paginated response
      final List<dynamic> results = data['results'];
      return results.map((json) => PayboxTransaction.fromJson(json)).toList();
    } else if (data is List) {
      // Direct list response
      return data.map((json) => PayboxTransaction.fromJson(json)).toList();
    } else {
      throw Exception('Unexpected response format');
    }
  }

  /// Initiate deposit to wallet
  Future<PayboxDepositResponse> initiateDeposit(double amount) async {
    final request = PayboxDepositRequest(
      amount: amount,
      paymentMethod: 'stripe',
    );

    final response = await _apiService.post(
      ApiConstants.payboxDeposit,
      data: request.toJson(),
    );

    return PayboxDepositResponse.fromJson(response.data);
  }

  /// Confirm deposit after successful payment
  Future<PayboxWallet> confirmDeposit(int transactionId, String paymentIntentId) async {
    final response = await _apiService.post(
      '${ApiConstants.payboxDeposit}confirm/',
      data: {
        'transaction_id': transactionId,
        'payment_intent_id': paymentIntentId,
      },
    );

    return PayboxWallet.fromJson(response.data);
  }

  /// Pay for order using paybox wallet
  Future<PayboxPaymentResponse> payWithPaybox(int orderId, double amount) async {
    final request = PayboxPaymentRequest(
      orderId: orderId,
      amount: amount,
    );

    final response = await _apiService.post(
      ApiConstants.payboxPayment,
      data: request.toJson(),
    );

    return PayboxPaymentResponse.fromJson(response.data);
  }

  /// Check if wallet has sufficient balance
  Future<bool> hasSufficientBalance(double amount) async {
    try {
      final wallet = await getWallet();
      return wallet.hasSufficientBalance(amount);
    } catch (e) {
      return false;
    }
  }

  /// Get wallet balance
  Future<double> getBalance() async {
    final wallet = await getWallet();
    return wallet.balance;
  }

  /// Get formatted wallet balance
  Future<String> getFormattedBalance() async {
    final wallet = await getWallet();
    return wallet.formattedBalance;
  }

  /// Get recent transactions
  Future<List<PayboxTransaction>> getRecentTransactions({int limit = 10}) async {
    return await getTransactions(pageSize: limit);
  }

  /// Get deposit transactions
  Future<List<PayboxTransaction>> getDepositTransactions() async {
    return await getTransactions(transactionType: 'DEPOSIT');
  }

  /// Get payment transactions
  Future<List<PayboxTransaction>> getPaymentTransactions() async {
    return await getTransactions(transactionType: 'PAYMENT');
  }

  /// Get refund transactions
  Future<List<PayboxTransaction>> getRefundTransactions() async {
    return await getTransactions(transactionType: 'REFUND');
  }

  /// Get completed transactions
  Future<List<PayboxTransaction>> getCompletedTransactions() async {
    return await getTransactions(status: 'COMPLETED');
  }

  /// Get pending transactions
  Future<List<PayboxTransaction>> getPendingTransactions() async {
    return await getTransactions(status: 'PENDING');
  }

  /// Get failed transactions
  Future<List<PayboxTransaction>> getFailedTransactions() async {
    return await getTransactions(status: 'FAILED');
  }

  /// Get transaction statistics
  Future<Map<String, dynamic>> getTransactionStats() async {
    final transactions = await getTransactions();
    
    final stats = <String, dynamic>{
      'total_transactions': transactions.length,
      'completed_transactions': transactions.where((t) => t.isCompleted).length,
      'pending_transactions': transactions.where((t) => t.isPending).length,
      'failed_transactions': transactions.where((t) => t.isFailed).length,
      'total_deposits': transactions.where((t) => t.isDeposit && t.isCompleted).fold(0.0, (sum, t) => sum + t.amount),
      'total_payments': transactions.where((t) => t.isPayment && t.isCompleted).fold(0.0, (sum, t) => sum + t.amount),
      'total_refunds': transactions.where((t) => t.isRefund && t.isCompleted).fold(0.0, (sum, t) => sum + t.amount),
    };

    return stats;
  }

  /// Validate deposit amount
  bool isValidDepositAmount(double amount) {
    return amount >= 10000 && amount <= 50000000; // 10,000 VND to 50,000,000 VND
  }

  /// Get minimum deposit amount
  double get minDepositAmount => 10000; // 10,000 VND

  /// Get maximum deposit amount
  double get maxDepositAmount => 50000000; // 50,000,000 VND

  /// Format transaction amount
  String formatTransactionAmount(PayboxTransaction transaction) {
    return transaction.formattedAmount;
  }

  /// Get transaction type display name
  String getTransactionTypeDisplayName(PayboxTransaction transaction) {
    return transaction.typeDisplayName;
  }

  /// Get transaction status display name
  String getTransactionStatusDisplayName(PayboxTransaction transaction) {
    return transaction.statusDisplayName;
  }

  /// Get transaction status color
  String getTransactionStatusColor(PayboxTransaction transaction) {
    return transaction.statusColor;
  }

  /// Format transaction date
  String formatTransactionDate(PayboxTransaction transaction) {
    final date = transaction.createdDate;
    return '${date.day}/${date.month}/${date.year}';
  }

  /// Format transaction time
  String formatTransactionTime(PayboxTransaction transaction) {
    final date = transaction.createdDate;
    return '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }

  /// Check if wallet is active
  Future<bool> isWalletActive() async {
    try {
      final wallet = await getWallet();
      return wallet.isActive;
    } catch (e) {
      return false;
    }
  }

  /// Get suggested deposit amounts
  List<double> getSuggestedDepositAmounts() {
    return [
      50000,   // 50,000 VND
      100000,  // 100,000 VND
      200000,  // 200,000 VND
      500000,  // 500,000 VND
      1000000, // 1,000,000 VND
      2000000, // 2,000,000 VND
      5000000, // 5,000,000 VND
    ];
  }

  /// Calculate deposit fee (if any)
  double calculateDepositFee(double amount) {
    // No fee for deposits in this implementation
    return 0.0;
  }

  /// Get total amount including fees
  double getTotalDepositAmount(double amount) {
    return amount + calculateDepositFee(amount);
  }
}
