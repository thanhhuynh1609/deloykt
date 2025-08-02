import 'package:flutter/foundation.dart';
import '../models/paybox.dart';
import '../services/paybox_service.dart';
import '../utils/currency_formatter.dart';

class PayboxProvider with ChangeNotifier {
  final PayboxService _payboxService = PayboxService();
  
  PayboxWallet? _wallet;
  List<PayboxTransaction> _transactions = [];
  
  bool _isLoading = false;
  bool _isLoadingTransactions = false;
  bool _isProcessingPayment = false;
  String? _error;

  // Getters
  PayboxWallet? get wallet => _wallet;
  List<PayboxTransaction> get transactions => _transactions;
  bool get isLoading => _isLoading;
  bool get isLoadingTransactions => _isLoadingTransactions;
  bool get isProcessingPayment => _isProcessingPayment;
  String? get error => _error;

  double get balance => _wallet?.balance ?? 0.0;
  String get formattedBalance => _wallet?.formattedBalance ?? '0 VND';
  bool get isWalletActive => _wallet?.isActive ?? false;

  // Initialize
  Future<void> initialize() async {
    await loadWallet();
    await loadTransactions();
  }

  // Load wallet
  Future<void> loadWallet() async {
    _setLoading(true);
    try {
      _wallet = await _payboxService.getWallet();
      _clearError();
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  // Load transactions
  Future<void> loadTransactions({
    int? page,
    int? pageSize,
    String? transactionType,
    String? status,
  }) async {
    _setLoadingTransactions(true);
    try {
      _transactions = await _payboxService.getTransactions(
        page: page,
        pageSize: pageSize,
        transactionType: transactionType,
        status: status,
      );
      _clearError();
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoadingTransactions(false);
    }
  }

  // Initiate deposit
  Future<PayboxDepositResponse?> initiateDeposit(double amount) async {
    if (!_payboxService.isValidDepositAmount(amount)) {
      _setError('Invalid deposit amount');
      return null;
    }

    _setProcessingPayment(true);
    try {
      final response = await _payboxService.initiateDeposit(amount);
      _clearError();
      return response;
    } catch (e) {
      _setError(e.toString());
      return null;
    } finally {
      _setProcessingPayment(false);
    }
  }

  // Confirm deposit
  Future<bool> confirmDeposit(int transactionId, String paymentIntentId) async {
    _setProcessingPayment(true);
    try {
      _wallet = await _payboxService.confirmDeposit(transactionId, paymentIntentId);
      await loadTransactions(); // Refresh transactions
      _clearError();
      notifyListeners();
      return true;
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setProcessingPayment(false);
    }
  }

  // Pay with paybox
  Future<PayboxPaymentResponse?> payWithPaybox(int orderId, double amount) async {
    if (!hasSufficientBalance(amount)) {
      _setError('Insufficient balance');
      return null;
    }

    _setProcessingPayment(true);
    try {
      final response = await _payboxService.payWithPaybox(orderId, amount);
      if (response.isSuccess) {
        await loadWallet(); // Refresh wallet balance
        await loadTransactions(); // Refresh transactions
      }
      _clearError();
      return response;
    } catch (e) {
      _setError(e.toString());
      return null;
    } finally {
      _setProcessingPayment(false);
    }
  }

  // Check sufficient balance
  bool hasSufficientBalance(double amount) {
    return _wallet?.hasSufficientBalance(amount) ?? false;
  }

  // Get recent transactions
  Future<void> loadRecentTransactions({int limit = 10}) async {
    await loadTransactions(pageSize: limit);
  }

  // Get transactions by type
  Future<void> loadDepositTransactions() async {
    await loadTransactions(transactionType: 'DEPOSIT');
  }

  Future<void> loadPaymentTransactions() async {
    await loadTransactions(transactionType: 'PAYMENT');
  }

  Future<void> loadRefundTransactions() async {
    await loadTransactions(transactionType: 'REFUND');
  }

  // Get transactions by status
  Future<void> loadCompletedTransactions() async {
    await loadTransactions(status: 'COMPLETED');
  }

  Future<void> loadPendingTransactions() async {
    await loadTransactions(status: 'PENDING');
  }

  Future<void> loadFailedTransactions() async {
    await loadTransactions(status: 'FAILED');
  }

  // Get transaction statistics
  Future<Map<String, dynamic>> getTransactionStats() async {
    try {
      return await _payboxService.getTransactionStats();
    } catch (e) {
      _setError(e.toString());
      return {};
    }
  }

  // Validation
  bool isValidDepositAmount(double amount) {
    return _payboxService.isValidDepositAmount(amount);
  }

  double get minDepositAmount => _payboxService.minDepositAmount;
  double get maxDepositAmount => _payboxService.maxDepositAmount;

  List<double> get suggestedDepositAmounts => _payboxService.getSuggestedDepositAmounts();

  // Formatting helpers
  String formatAmount(double amount) {
    return CurrencyFormatter.formatVND(amount);
  }

  String formatTransactionAmount(PayboxTransaction transaction) {
    return _payboxService.formatTransactionAmount(transaction);
  }

  String getTransactionTypeDisplayName(PayboxTransaction transaction) {
    return _payboxService.getTransactionTypeDisplayName(transaction);
  }

  String getTransactionStatusDisplayName(PayboxTransaction transaction) {
    return _payboxService.getTransactionStatusDisplayName(transaction);
  }

  String getTransactionStatusColor(PayboxTransaction transaction) {
    return _payboxService.getTransactionStatusColor(transaction);
  }

  String formatTransactionDate(PayboxTransaction transaction) {
    return _payboxService.formatTransactionDate(transaction);
  }

  String formatTransactionTime(PayboxTransaction transaction) {
    return _payboxService.formatTransactionTime(transaction);
  }

  // Filter transactions
  List<PayboxTransaction> getTransactionsByType(String type) {
    return _transactions.where((t) => t.transactionType == type).toList();
  }

  List<PayboxTransaction> getTransactionsByStatus(String status) {
    return _transactions.where((t) => t.status == status).toList();
  }

  List<PayboxTransaction> getCompletedTransactions() {
    return _transactions.where((t) => t.isCompleted).toList();
  }

  List<PayboxTransaction> getPendingTransactions() {
    return _transactions.where((t) => t.isPending).toList();
  }

  List<PayboxTransaction> getFailedTransactions() {
    return _transactions.where((t) => t.isFailed).toList();
  }

  // Calculate totals
  double getTotalDeposits() {
    return _transactions
        .where((t) => t.isDeposit && t.isCompleted)
        .fold(0.0, (sum, t) => sum + t.amount);
  }

  double getTotalPayments() {
    return _transactions
        .where((t) => t.isPayment && t.isCompleted)
        .fold(0.0, (sum, t) => sum + t.amount);
  }

  double getTotalRefunds() {
    return _transactions
        .where((t) => t.isRefund && t.isCompleted)
        .fold(0.0, (sum, t) => sum + t.amount);
  }

  // Private methods
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setLoadingTransactions(bool loading) {
    _isLoadingTransactions = loading;
    notifyListeners();
  }

  void _setProcessingPayment(bool processing) {
    _isProcessingPayment = processing;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
    notifyListeners();
  }

  void clearError() {
    _clearError();
  }

  // Refresh all data
  Future<void> refresh() async {
    await loadWallet();
    await loadTransactions();
  }

  // Check if can make payment
  bool canMakePayment(double amount) {
    return isWalletActive && hasSufficientBalance(amount);
  }

  // Get payment error message
  String? getPaymentErrorMessage(double amount) {
    if (!isWalletActive) return 'Wallet is not active';
    if (!hasSufficientBalance(amount)) return 'Insufficient balance';
    return null;
  }
}
