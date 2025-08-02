import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../constants/app_constants.dart';
import '../../providers/cart_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/paybox_provider.dart';
import '../../services/order_service.dart';
import '../../models/cart.dart';
import '../../utils/currency_formatter.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final _addressController = TextEditingController();
  final _cityController = TextEditingController();
  final _postalCodeController = TextEditingController();
  final _countryController = TextEditingController(text: 'Vietnam');
  
  String _selectedPaymentMethod = AppConstants.paymentMethodStripe;
  bool _isProcessing = false;
  
  final OrderService _orderService = OrderService();

  @override
  void initState() {
    super.initState();
    _loadSavedAddress();
  }

  @override
  void dispose() {
    _addressController.dispose();
    _cityController.dispose();
    _postalCodeController.dispose();
    _countryController.dispose();
    super.dispose();
  }

  void _loadSavedAddress() {
    final cartProvider = context.read<CartProvider>();
    final savedAddress = cartProvider.shippingAddress;
    if (savedAddress != null) {
      _addressController.text = savedAddress.address;
      _cityController.text = savedAddress.city;
      _postalCodeController.text = savedAddress.postalCode;
      _countryController.text = savedAddress.country;
    }
  }

  Future<void> _placeOrder() async {
    if (!_formKey.currentState!.validate()) return;

    final cartProvider = context.read<CartProvider>();
    final payboxProvider = context.read<PayboxProvider>();

    // Validate cart
    if (!cartProvider.validateForCheckout()) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(cartProvider.getValidationErrors().join('\n')),
          backgroundColor: AppConstants.errorColor,
        ),
      );
      return;
    }

    // Check paybox balance if using paybox
    if (_selectedPaymentMethod == AppConstants.paymentMethodPaybox) {
      if (!payboxProvider.canMakePayment(cartProvider.totalPrice)) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(payboxProvider.getPaymentErrorMessage(cartProvider.totalPrice) ?? 'Payment error'),
            backgroundColor: AppConstants.errorColor,
          ),
        );
        return;
      }
    }

    setState(() => _isProcessing = true);

    try {
      // Update shipping address
      final shippingAddress = ShippingAddress(
        address: _addressController.text.trim(),
        city: _cityController.text.trim(),
        postalCode: _postalCodeController.text.trim(),
        country: _countryController.text.trim(),
      );
      
      await cartProvider.updateShippingAddress(shippingAddress);
      await cartProvider.updatePaymentMethod(_selectedPaymentMethod);

      // Place order
      final order = await _orderService.placeOrder(cartProvider.getCart());

      if (mounted) {
        // Clear cart after successful order
        await cartProvider.clearCart();
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(AppConstants.orderPlacedSuccessMessage),
            backgroundColor: AppConstants.successColor,
          ),
        );

        // Navigate to order confirmation
        context.go('/order-confirmation/${order.id}');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Order failed: ${e.toString()}'),
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
    return Scaffold(
      appBar: AppBar(
        title: const Text('Checkout'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/cart'),
        ),
      ),
      body: Consumer<CartProvider>(
        builder: (context, cartProvider, child) {
          if (cartProvider.isEmpty) {
            return const Center(
              child: Text('Your cart is empty'),
            );
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(AppConstants.defaultPadding),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Order Summary
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(AppConstants.defaultPadding),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Order Summary',
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 16),
                          ...cartProvider.items.map((item) => Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    '${item.itemName} x${item.qty}',
                                    style: Theme.of(context).textTheme.bodyMedium,
                                  ),
                                ),
                                Text(
                                  CurrencyFormatter.formatVND(item.totalPrice),
                                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          )),
                          const Divider(),
                          _buildSummaryRow('Subtotal', cartProvider.formattedItemsPrice),
                          _buildSummaryRow('Shipping', cartProvider.formattedShippingPrice),
                          _buildSummaryRow('Tax', cartProvider.formattedTaxPrice),
                          if (cartProvider.discountAmount > 0)
                            _buildSummaryRow(
                              'Discount',
                              '-${cartProvider.formattedDiscountAmount}',
                              color: AppConstants.successColor,
                            ),
                          const Divider(),
                          _buildSummaryRow(
                            'Total',
                            cartProvider.formattedTotalPrice,
                            isTotal: true,
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Shipping Address
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(AppConstants.defaultPadding),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Shipping Address',
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _addressController,
                            decoration: const InputDecoration(
                              labelText: 'Address',
                              prefixIcon: Icon(Icons.location_on),
                            ),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'Please enter your address';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              Expanded(
                                child: TextFormField(
                                  controller: _cityController,
                                  decoration: const InputDecoration(
                                    labelText: 'City',
                                    prefixIcon: Icon(Icons.location_city),
                                  ),
                                  validator: (value) {
                                    if (value == null || value.trim().isEmpty) {
                                      return 'Please enter your city';
                                    }
                                    return null;
                                  },
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: TextFormField(
                                  controller: _postalCodeController,
                                  decoration: const InputDecoration(
                                    labelText: 'Postal Code',
                                    prefixIcon: Icon(Icons.markunread_mailbox),
                                  ),
                                  validator: (value) {
                                    if (value == null || value.trim().isEmpty) {
                                      return 'Please enter postal code';
                                    }
                                    return null;
                                  },
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _countryController,
                            decoration: const InputDecoration(
                              labelText: 'Country',
                              prefixIcon: Icon(Icons.flag),
                            ),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'Please enter your country';
                              }
                              return null;
                            },
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Payment Method
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(AppConstants.defaultPadding),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Payment Method',
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 16),
                          RadioListTile<String>(
                            title: const Text('Credit/Debit Card (Stripe)'),
                            subtitle: const Text('Pay with your credit or debit card'),
                            value: AppConstants.paymentMethodStripe,
                            groupValue: _selectedPaymentMethod,
                            onChanged: (value) {
                              setState(() => _selectedPaymentMethod = value!);
                            },
                          ),
                          Consumer<PayboxProvider>(
                            builder: (context, payboxProvider, child) {
                              return RadioListTile<String>(
                                title: const Text('Paybox Wallet'),
                                subtitle: Text('Balance: ${payboxProvider.formattedBalance}'),
                                value: AppConstants.paymentMethodPaybox,
                                groupValue: _selectedPaymentMethod,
                                onChanged: (value) {
                                  setState(() => _selectedPaymentMethod = value!);
                                },
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
      bottomNavigationBar: Consumer<CartProvider>(
        builder: (context, cartProvider, child) {
          return Container(
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
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isProcessing ? null : _placeOrder,
                child: _isProcessing
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Text('Place Order - ${cartProvider.formattedTotalPrice}'),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSummaryRow(
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
