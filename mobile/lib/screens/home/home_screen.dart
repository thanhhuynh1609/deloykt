import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../constants/app_constants.dart';
import '../../providers/auth_provider.dart';
import '../../providers/product_provider.dart';
import '../../providers/cart_provider.dart';
import '../../utils/currency_formatter.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  bool _hasInitialized = false;

  @override
  void initState() {
    super.initState();
    // Use post frame callback to avoid setState during build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initializeData();
    });
  }

  Future<void> _initializeData() async {
    if (_hasInitialized) return;

    _hasInitialized = true;
    final productProvider = context.read<ProductProvider>();

    // Only load if not already loaded to prevent infinite loops
    if (productProvider.products.isEmpty) {
      await productProvider.loadProducts();
    }
    if (productProvider.featuredProducts.isEmpty) {
      await productProvider.loadFeaturedProducts();
    }
    if (productProvider.newArrivals.isEmpty) {
      await productProvider.loadNewArrivals();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: [
          _buildHomeTab(),
          _buildCategoriesTab(),
          _buildCartTab(),
          _buildProfileTab(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.category),
            label: 'Categories',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.shopping_cart),
            label: 'Cart',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }

  Widget _buildHomeTab() {
    return Scaffold(
      appBar: AppBar(
        title: const Text('E-commerce Mobile'),
        actions: [
          // Cart Icon with Badge
          Consumer<CartProvider>(
            builder: (context, cartProvider, child) {
              return Stack(
                children: [
                  IconButton(
                    icon: const Icon(Icons.shopping_cart),
                    onPressed: () => context.go('/cart'),
                  ),
                  if (cartProvider.totalItems > 0)
                    Positioned(
                      right: 8,
                      top: 8,
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: BoxDecoration(
                          color: AppConstants.errorColor,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 16,
                          minHeight: 16,
                        ),
                        child: Text(
                          '${cartProvider.totalItems}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
          // Search Icon
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () => context.go('/search'),
          ),
          // Chat Icon
          IconButton(
            icon: const Icon(Icons.chat),
            onPressed: () => context.go('/chat'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          final productProvider = context.read<ProductProvider>();
          await productProvider.refresh();
        },
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppConstants.defaultPadding),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome Section
              Consumer<AuthProvider>(
                builder: (context, authProvider, child) {
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(AppConstants.defaultPadding),
                      child: Row(
                        children: [
                          const CircleAvatar(
                            backgroundColor: AppConstants.primaryColor,
                            child: Icon(Icons.person, color: Colors.white),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Welcome back!',
                                  style: Theme.of(context).textTheme.titleMedium,
                                ),
                                Text(
                                  authProvider.user?.username ?? 'Guest',
                                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: AppConstants.textSecondaryColor,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),

              const SizedBox(height: 24),

              // Featured Products
              Text(
                'Featured Products',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),

              Consumer<ProductProvider>(
                builder: (context, productProvider, child) {
                  if (productProvider.isLoading) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  
                  if (productProvider.featuredProducts.isEmpty) {
                    return const Card(
                      child: Padding(
                        padding: EdgeInsets.all(AppConstants.defaultPadding),
                        child: Text('No featured products available'),
                      ),
                    );
                  }
                  
                  return SizedBox(
                    height: 250,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: productProvider.featuredProducts.length,
                      itemBuilder: (context, index) {
                        final product = productProvider.featuredProducts[index];
                        return Container(
                          width: 200,
                          margin: const EdgeInsets.only(right: 16),
                          child: Card(
                            child: InkWell(
                              onTap: () => context.go('/product/${product.id}'),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Container(
                                      width: double.infinity,
                                      decoration: BoxDecoration(
                                        color: Colors.grey[200],
                                        borderRadius: const BorderRadius.vertical(
                                          top: Radius.circular(AppConstants.borderRadius),
                                        ),
                                      ),
                                      child: product.image != null
                                          ? ClipRRect(
                                              borderRadius: const BorderRadius.vertical(
                                                top: Radius.circular(AppConstants.borderRadius),
                                              ),
                                              child: Image.network(
                                                product.image!,
                                                fit: BoxFit.cover,
                                                errorBuilder: (context, error, stackTrace) {
                                                  return const Icon(Icons.image_not_supported);
                                                },
                                              ),
                                            )
                                          : const Icon(Icons.image_not_supported),
                                    ),
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.all(12),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          product.name,
                                          style: Theme.of(context).textTheme.titleSmall,
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          CurrencyFormatter.formatVND(product.price),
                                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                            color: AppConstants.primaryColor,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  );
                },
              ),

              const SizedBox(height: 24),

              // New Arrivals
              Text(
                'New Arrivals',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),

              Consumer<ProductProvider>(
                builder: (context, productProvider, child) {
                  if (productProvider.newArrivals.isEmpty) {
                    return const Card(
                      child: Padding(
                        padding: EdgeInsets.all(AppConstants.defaultPadding),
                        child: Text('No new arrivals available'),
                      ),
                    );
                  }
                  
                  return SizedBox(
                    height: 250,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: productProvider.newArrivals.length,
                      itemBuilder: (context, index) {
                        final product = productProvider.newArrivals[index];
                        return Container(
                          width: 200,
                          margin: const EdgeInsets.only(right: 16),
                          child: Card(
                            child: InkWell(
                              onTap: () => context.go('/product/${product.id}'),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Container(
                                      width: double.infinity,
                                      decoration: BoxDecoration(
                                        color: Colors.grey[200],
                                        borderRadius: const BorderRadius.vertical(
                                          top: Radius.circular(AppConstants.borderRadius),
                                        ),
                                      ),
                                      child: product.image != null
                                          ? ClipRRect(
                                              borderRadius: const BorderRadius.vertical(
                                                top: Radius.circular(AppConstants.borderRadius),
                                              ),
                                              child: Image.network(
                                                product.image!,
                                                fit: BoxFit.cover,
                                                errorBuilder: (context, error, stackTrace) {
                                                  return const Icon(Icons.image_not_supported);
                                                },
                                              ),
                                            )
                                          : const Icon(Icons.image_not_supported),
                                    ),
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.all(12),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          product.name,
                                          style: Theme.of(context).textTheme.titleSmall,
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          CurrencyFormatter.formatVND(product.price),
                                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                            color: AppConstants.primaryColor,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCategoriesTab() {
    return const Center(
      child: Text('Categories Tab - Coming Soon'),
    );
  }

  Widget _buildCartTab() {
    return const Center(
      child: Text('Cart Tab - Coming Soon'),
    );
  }

  Widget _buildProfileTab() {
    return const Center(
      child: Text('Profile Tab - Coming Soon'),
    );
  }
}
