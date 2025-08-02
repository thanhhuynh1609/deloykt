import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../constants/app_constants.dart';
import '../../providers/cart_provider.dart';
import '../../utils/currency_formatter.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Shopping Cart'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/home'),
        ),
      ),
      body: Consumer<CartProvider>(
        builder: (context, cartProvider, child) {
          if (cartProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (cartProvider.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.shopping_cart_outlined,
                    size: 100,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Your cart is empty',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Add some products to get started',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey[500],
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () => context.go('/home'),
                    child: const Text('Continue Shopping'),
                  ),
                ],
              ),
            );
          }

          return Column(
            children: [
              // Cart Items
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(AppConstants.defaultPadding),
                  itemCount: cartProvider.items.length,
                  itemBuilder: (context, index) {
                    final item = cartProvider.items[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 16),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          children: [
                            // Product Image
                            Container(
                              width: 80,
                              height: 80,
                              decoration: BoxDecoration(
                                color: Colors.grey[200],
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: item.itemImage.isNotEmpty
                                  ? ClipRRect(
                                      borderRadius: BorderRadius.circular(8),
                                      child: Image.network(
                                        item.itemImage,
                                        fit: BoxFit.cover,
                                        errorBuilder: (context, error, stackTrace) {
                                          return const Icon(Icons.image_not_supported);
                                        },
                                      ),
                                    )
                                  : const Icon(Icons.image_not_supported),
                            ),

                            const SizedBox(width: 12),

                            // Product Info
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.itemName,
                                    style: Theme.of(context).textTheme.titleMedium,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  if (item.variantDescription.isNotEmpty) ...[
                                    const SizedBox(height: 4),
                                    Text(
                                      item.variantDescription,
                                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                        color: AppConstants.textSecondaryColor,
                                      ),
                                    ),
                                  ],
                                  const SizedBox(height: 8),
                                  Text(
                                    CurrencyFormatter.formatVND(item.itemPrice),
                                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                      color: AppConstants.primaryColor,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            // Quantity Controls
                            Column(
                              children: [
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    IconButton(
                                      onPressed: item.qty > 1
                                          ? () => cartProvider.updateItemQuantity(
                                                item.id,
                                                item.variantId,
                                                item.qty - 1,
                                              )
                                          : null,
                                      icon: const Icon(Icons.remove),
                                      iconSize: 20,
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 12,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        border: Border.all(color: Colors.grey),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        item.qty.toString(),
                                        style: Theme.of(context).textTheme.titleSmall,
                                      ),
                                    ),
                                    IconButton(
                                      onPressed: () => cartProvider.updateItemQuantity(
                                        item.id,
                                        item.variantId,
                                        item.qty + 1,
                                      ),
                                      icon: const Icon(Icons.add),
                                      iconSize: 20,
                                    ),
                                  ],
                                ),
                                TextButton(
                                  onPressed: () => cartProvider.removeItem(
                                    item.id,
                                    item.variantId,
                                  ),
                                  child: const Text(
                                    'Remove',
                                    style: TextStyle(color: AppConstants.errorColor),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),

              // Cart Summary
              Container(
                padding: const EdgeInsets.all(AppConstants.defaultPadding),
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 4,
                      offset: const Offset(0, -2),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    // Summary Rows
                    _buildSummaryRow(
                      context,
                      'Subtotal',
                      cartProvider.formattedItemsPrice,
                    ),
                    _buildSummaryRow(
                      context,
                      'Shipping',
                      cartProvider.formattedShippingPrice,
                    ),
                    _buildSummaryRow(
                      context,
                      'Tax',
                      cartProvider.formattedTaxPrice,
                    ),
                    if (cartProvider.discountAmount > 0)
                      _buildSummaryRow(
                        context,
                        'Discount',
                        '-${cartProvider.formattedDiscountAmount}',
                        color: AppConstants.successColor,
                      ),
                    const Divider(),
                    _buildSummaryRow(
                      context,
                      'Total',
                      cartProvider.formattedTotalPrice,
                      isTotal: true,
                    ),

                    const SizedBox(height: 16),

                    // Checkout Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          // TODO: Navigate to checkout
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Checkout feature coming soon!'),
                            ),
                          );
                        },
                        child: Text(
                          'Checkout (${cartProvider.totalItems} items)',
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildSummaryRow(
    BuildContext context,
    String label,
    String value, {
    Color? color,
    bool isTotal = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: isTotal
                ? Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  )
                : Theme.of(context).textTheme.bodyMedium,
          ),
          Text(
            value,
            style: isTotal
                ? Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: color ?? AppConstants.primaryColor,
                  )
                : Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: color,
                  ),
          ),
        ],
      ),
    );
  }
}
