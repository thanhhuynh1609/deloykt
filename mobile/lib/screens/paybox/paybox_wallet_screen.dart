import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../constants/app_constants.dart';
import '../../providers/paybox_provider.dart';
import '../../utils/currency_formatter.dart';

class PayboxWalletScreen extends StatefulWidget {
  const PayboxWalletScreen({super.key});

  @override
  State<PayboxWalletScreen> createState() => _PayboxWalletScreenState();
}

class _PayboxWalletScreenState extends State<PayboxWalletScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _hasInitialized = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _initializePayboxData();
  }

  Future<void> _initializePayboxData() async {
    if (_hasInitialized) return;

    _hasInitialized = true;
    final payboxProvider = context.read<PayboxProvider>();

    // Only load if wallet is null (not loaded yet)
    if (payboxProvider.wallet == null) {
      await payboxProvider.loadWallet();
    }

    // Only load if transactions are empty
    if (payboxProvider.transactions.isEmpty) {
      await payboxProvider.loadTransactions();
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Paybox Wallet'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/profile'),
        ),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Wallet', icon: Icon(Icons.account_balance_wallet)),
            Tab(text: 'Transactions', icon: Icon(Icons.history)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          _WalletTab(),
          _TransactionsTab(),
        ],
      ),
    );
  }
}

class _WalletTab extends StatelessWidget {
  const _WalletTab();

  @override
  Widget build(BuildContext context) {
    return Consumer<PayboxProvider>(
      builder: (context, payboxProvider, child) {
        if (payboxProvider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        if (payboxProvider.error != null) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.error_outline,
                  size: 64,
                  color: AppConstants.errorColor,
                ),
                const SizedBox(height: 16),
                Text(
                  'Failed to load wallet',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 8),
                Text(
                  payboxProvider.error!,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppConstants.textSecondaryColor,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => payboxProvider.refresh(),
                  child: const Text('Retry'),
                ),
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () => payboxProvider.refresh(),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(AppConstants.defaultPadding),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Wallet Balance Card
                Card(
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(AppConstants.largePadding),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppConstants.primaryColor,
                          AppConstants.primaryColor.withOpacity(0.8),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(AppConstants.borderRadius),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Paybox Wallet',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: payboxProvider.isWalletActive
                                    ? AppConstants.successColor
                                    : AppConstants.errorColor,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                payboxProvider.isWalletActive ? 'Active' : 'Inactive',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'Available Balance',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          payboxProvider.formattedBalance,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // Quick Actions
                Text(
                  'Quick Actions',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),

                Row(
                  children: [
                    Expanded(
                      child: _buildActionCard(
                        context,
                        icon: Icons.add,
                        title: 'Top Up',
                        subtitle: 'Add money to wallet',
                        color: AppConstants.successColor,
                        onTap: () => _showTopUpDialog(context),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildActionCard(
                        context,
                        icon: Icons.history,
                        title: 'History',
                        subtitle: 'View transactions',
                        color: AppConstants.primaryColor,
                        onTap: () {
                          final tabController = DefaultTabController.of(context);
                          tabController?.animateTo(1);
                        },
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // Suggested Top-up Amounts
                Text(
                  'Quick Top-up',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),

                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: payboxProvider.suggestedDepositAmounts.map((amount) {
                    return ActionChip(
                      label: Text(CurrencyFormatter.formatVNDWithoutSymbol(amount)),
                      onPressed: () => _showTopUpDialog(context, prefilledAmount: amount),
                      backgroundColor: AppConstants.primaryColor.withOpacity(0.1),
                      labelStyle: TextStyle(
                        color: AppConstants.primaryColor,
                        fontWeight: FontWeight.bold,
                      ),
                    );
                  }).toList(),
                ),

                const SizedBox(height: 24),

                // Recent Transactions Preview
                Text(
                  'Recent Transactions',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),

                if (payboxProvider.transactions.isEmpty)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(AppConstants.defaultPadding),
                      child: Center(
                        child: Column(
                          children: [
                            Icon(
                              Icons.receipt_long_outlined,
                              size: 48,
                              color: Colors.grey[400],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'No transactions yet',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  )
                else
                  ...payboxProvider.transactions.take(3).map((transaction) {
                    return Card(
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: _getTransactionColor(transaction.transactionType),
                          child: Icon(
                            _getTransactionIcon(transaction.transactionType),
                            color: Colors.white,
                          ),
                        ),
                        title: Text(payboxProvider.getTransactionTypeDisplayName(transaction)),
                        subtitle: Text(payboxProvider.formatTransactionDate(transaction)),
                        trailing: Text(
                          '${transaction.isDeposit ? '+' : '-'}${payboxProvider.formatTransactionAmount(transaction)}',
                          style: TextStyle(
                            color: transaction.isDeposit
                                ? AppConstants.successColor
                                : AppConstants.errorColor,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    );
                  }),

                if (payboxProvider.transactions.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Center(
                    child: TextButton(
                      onPressed: () {
                        final tabController = DefaultTabController.of(context);
                        tabController?.animateTo(1);
                      },
                      child: const Text('View All Transactions'),
                    ),
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildActionCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppConstants.borderRadius),
        child: Padding(
          padding: const EdgeInsets.all(AppConstants.defaultPadding),
          child: Column(
            children: [
              CircleAvatar(
                backgroundColor: color,
                radius: 24,
                child: Icon(icon, color: Colors.white),
              ),
              const SizedBox(height: 12),
              Text(
                title,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppConstants.textSecondaryColor,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getTransactionColor(String type) {
    switch (type) {
      case 'DEPOSIT':
        return AppConstants.successColor;
      case 'PAYMENT':
        return AppConstants.primaryColor;
      case 'REFUND':
        return AppConstants.warningColor;
      default:
        return Colors.grey;
    }
  }

  IconData _getTransactionIcon(String type) {
    switch (type) {
      case 'DEPOSIT':
        return Icons.add;
      case 'PAYMENT':
        return Icons.shopping_cart;
      case 'REFUND':
        return Icons.refresh;
      default:
        return Icons.receipt;
    }
  }

  void _showTopUpDialog(BuildContext context, {double? prefilledAmount}) {
    showDialog(
      context: context,
      builder: (context) => _TopUpDialog(prefilledAmount: prefilledAmount),
    );
  }
}

class _TransactionsTab extends StatelessWidget {
  const _TransactionsTab();

  @override
  Widget build(BuildContext context) {
    return Consumer<PayboxProvider>(
      builder: (context, payboxProvider, child) {
        if (payboxProvider.isLoadingTransactions) {
          return const Center(child: CircularProgressIndicator());
        }

        if (payboxProvider.transactions.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.receipt_long_outlined,
                  size: 100,
                  color: Colors.grey[400],
                ),
                const SizedBox(height: 16),
                Text(
                  'No transactions yet',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Your transaction history will appear here',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey[500],
                  ),
                ),
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () => payboxProvider.loadTransactions(),
          child: ListView.builder(
            padding: const EdgeInsets.all(AppConstants.defaultPadding),
            itemCount: payboxProvider.transactions.length,
            itemBuilder: (context, index) {
              final transaction = payboxProvider.transactions[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: _getTransactionColor(transaction.transactionType),
                    child: Icon(
                      _getTransactionIcon(transaction.transactionType),
                      color: Colors.white,
                    ),
                  ),
                  title: Text(payboxProvider.getTransactionTypeDisplayName(transaction)),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(payboxProvider.formatTransactionDate(transaction)),
                      if (transaction.description != null)
                        Text(
                          transaction.description!,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                    ],
                  ),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '${transaction.isDeposit ? '+' : '-'}${payboxProvider.formatTransactionAmount(transaction)}',
                        style: TextStyle(
                          color: transaction.isDeposit
                              ? AppConstants.successColor
                              : AppConstants.errorColor,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: _getStatusColor(transaction.status),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          payboxProvider.getTransactionStatusDisplayName(transaction),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  isThreeLine: transaction.description != null,
                ),
              );
            },
          ),
        );
      },
    );
  }

  Color _getTransactionColor(String type) {
    switch (type) {
      case 'DEPOSIT':
        return AppConstants.successColor;
      case 'PAYMENT':
        return AppConstants.primaryColor;
      case 'REFUND':
        return AppConstants.warningColor;
      default:
        return Colors.grey;
    }
  }

  IconData _getTransactionIcon(String type) {
    switch (type) {
      case 'DEPOSIT':
        return Icons.add;
      case 'PAYMENT':
        return Icons.shopping_cart;
      case 'REFUND':
        return Icons.refresh;
      default:
        return Icons.receipt;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'COMPLETED':
        return AppConstants.successColor;
      case 'PENDING':
        return AppConstants.warningColor;
      case 'FAILED':
      case 'CANCELLED':
        return AppConstants.errorColor;
      default:
        return Colors.grey;
    }
  }
}

class _TopUpDialog extends StatefulWidget {
  final double? prefilledAmount;

  const _TopUpDialog({this.prefilledAmount});

  @override
  State<_TopUpDialog> createState() => _TopUpDialogState();
}

class _TopUpDialogState extends State<_TopUpDialog> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    if (widget.prefilledAmount != null) {
      _amountController.text = widget.prefilledAmount!.toStringAsFixed(0);
    }
  }

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _topUp() async {
    if (!_formKey.currentState!.validate()) return;

    final amount = double.tryParse(_amountController.text);
    if (amount == null) return;

    setState(() => _isProcessing = true);

    try {
      final payboxProvider = context.read<PayboxProvider>();
      final response = await payboxProvider.initiateDeposit(amount);

      if (response != null && mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Top-up initiated successfully!'),
            backgroundColor: AppConstants.successColor,
          ),
        );
        // TODO: Handle Stripe payment flow
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Top-up failed: ${e.toString()}'),
            backgroundColor: AppConstants.errorColor,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Top Up Wallet'),
      content: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextFormField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Amount (VND)',
                prefixIcon: Icon(Icons.attach_money),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter an amount';
                }
                final amount = double.tryParse(value);
                if (amount == null) {
                  return 'Please enter a valid amount';
                }
                final payboxProvider = context.read<PayboxProvider>();
                if (!payboxProvider.isValidDepositAmount(amount)) {
                  return 'Amount must be between ${CurrencyFormatter.formatVND(payboxProvider.minDepositAmount)} and ${CurrencyFormatter.formatVND(payboxProvider.maxDepositAmount)}';
                }
                return null;
              },
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _isProcessing ? null : () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _isProcessing ? null : _topUp,
          child: _isProcessing
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Top Up'),
        ),
      ],
    );
  }
}
