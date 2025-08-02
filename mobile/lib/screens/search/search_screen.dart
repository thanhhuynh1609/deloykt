import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../constants/app_constants.dart';
import '../../providers/product_provider.dart';
import '../../models/product.dart';
import '../../widgets/product_card.dart';
import '../../utils/currency_formatter.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  
  String _currentQuery = '';
  int? _selectedCategoryId;
  int? _selectedBrandId;
  double? _minPrice;
  double? _maxPrice;
  String _sortBy = 'name';
  
  List<Product> _searchResults = [];
  bool _isSearching = false;
  bool _hasSearched = false;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    final productProvider = context.read<ProductProvider>();
    await Future.wait([
      productProvider.loadBrands(),
      productProvider.loadCategories(),
    ]);
  }

  Future<void> _performSearch() async {
    final query = _searchController.text.trim();
    if (query.isEmpty && _selectedCategoryId == null && _selectedBrandId == null) {
      return;
    }

    setState(() {
      _isSearching = true;
      _currentQuery = query;
    });

    try {
      final productProvider = context.read<ProductProvider>();
      await productProvider.loadProducts(
        search: query.isNotEmpty ? query : null,
        categoryId: _selectedCategoryId,
        brandId: _selectedBrandId,
        minPrice: _minPrice,
        maxPrice: _maxPrice,
        ordering: _sortBy,
        refresh: true,
      );

      setState(() {
        _searchResults = productProvider.products;
        _hasSearched = true;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Search failed: ${e.toString()}'),
            backgroundColor: AppConstants.errorColor,
          ),
        );
      }
    } finally {
      setState(() {
        _isSearching = false;
      });
    }
  }

  void _clearSearch() {
    setState(() {
      _searchController.clear();
      _currentQuery = '';
      _selectedCategoryId = null;
      _selectedBrandId = null;
      _minPrice = null;
      _maxPrice = null;
      _sortBy = 'name';
      _searchResults = [];
      _hasSearched = false;
    });
  }

  void _showFilterDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => _FilterBottomSheet(
        selectedCategoryId: _selectedCategoryId,
        selectedBrandId: _selectedBrandId,
        minPrice: _minPrice,
        maxPrice: _maxPrice,
        sortBy: _sortBy,
        onApplyFilters: (categoryId, brandId, minPrice, maxPrice, sortBy) {
          setState(() {
            _selectedCategoryId = categoryId;
            _selectedBrandId = brandId;
            _minPrice = minPrice;
            _maxPrice = maxPrice;
            _sortBy = sortBy;
          });
          _performSearch();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Search Products'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/home'),
        ),
        actions: [
          if (_hasSearched)
            IconButton(
              icon: const Icon(Icons.clear),
              onPressed: _clearSearch,
            ),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Container(
            padding: const EdgeInsets.all(AppConstants.defaultPadding),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Search products...',
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                    ),
                    onSubmitted: (_) => _performSearch(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: _showFilterDialog,
                  icon: Icon(
                    Icons.filter_list,
                    color: _hasFiltersApplied() ? AppConstants.primaryColor : null,
                  ),
                ),
                IconButton(
                  onPressed: _performSearch,
                  icon: const Icon(Icons.search),
                ),
              ],
            ),
          ),

          // Active Filters
          if (_hasFiltersApplied()) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppConstants.defaultPadding),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (_selectedCategoryId != null)
                    _buildFilterChip(
                      'Category: ${_getCategoryName(_selectedCategoryId!)}',
                      () => setState(() => _selectedCategoryId = null),
                    ),
                  if (_selectedBrandId != null)
                    _buildFilterChip(
                      'Brand: ${_getBrandName(_selectedBrandId!)}',
                      () => setState(() => _selectedBrandId = null),
                    ),
                  if (_minPrice != null || _maxPrice != null)
                    _buildFilterChip(
                      'Price: ${_getPriceRangeText()}',
                      () => setState(() {
                        _minPrice = null;
                        _maxPrice = null;
                      }),
                    ),
                ],
              ),
            ),
          ],

          // Search Results
          Expanded(
            child: _buildSearchResults(),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchResults() {
    if (!_hasSearched) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.search,
              size: 100,
              color: Colors.grey,
            ),
            SizedBox(height: 16),
            Text(
              'Search for products',
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Use the search bar above to find products',
              style: TextStyle(
                color: Colors.grey,
              ),
            ),
          ],
        ),
      );
    }

    if (_isSearching) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_searchResults.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.search_off,
              size: 100,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No products found',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Try adjusting your search or filters',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey[500],
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _clearSearch,
              child: const Text('Clear Search'),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        // Results Count
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(AppConstants.defaultPadding),
          child: Text(
            '${_searchResults.length} products found',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
        ),

        // Products Grid
        Expanded(
          child: GridView.builder(
            controller: _scrollController,
            padding: const EdgeInsets.all(AppConstants.defaultPadding),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 0.75,
              crossAxisSpacing: AppConstants.defaultPadding,
              mainAxisSpacing: AppConstants.defaultPadding,
            ),
            itemCount: _searchResults.length,
            itemBuilder: (context, index) {
              final product = _searchResults[index];
              return ProductCard(
                product: product,
                onTap: () => context.go('/product/${product.id}'),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildFilterChip(String label, VoidCallback onRemove) {
    return Chip(
      label: Text(label),
      deleteIcon: const Icon(Icons.close, size: 18),
      onDeleted: onRemove,
      backgroundColor: AppConstants.primaryColor.withOpacity(0.1),
      labelStyle: TextStyle(
        color: AppConstants.primaryColor,
        fontWeight: FontWeight.bold,
      ),
    );
  }

  bool _hasFiltersApplied() {
    return _selectedCategoryId != null ||
           _selectedBrandId != null ||
           _minPrice != null ||
           _maxPrice != null;
  }

  String _getCategoryName(int categoryId) {
    final productProvider = context.read<ProductProvider>();
    final category = productProvider.categories.firstWhere(
      (c) => c.id == categoryId,
      orElse: () => Category(id: categoryId, title: 'Unknown'),
    );
    return category.name;
  }

  String _getBrandName(int brandId) {
    final productProvider = context.read<ProductProvider>();
    final brand = productProvider.brands.firstWhere(
      (b) => b.id == brandId,
      orElse: () => Brand(id: brandId, title: 'Unknown'),
    );
    return brand.name;
  }

  String _getPriceRangeText() {
    if (_minPrice != null && _maxPrice != null) {
      return '${CurrencyFormatter.formatVND(_minPrice!)} - ${CurrencyFormatter.formatVND(_maxPrice!)}';
    } else if (_minPrice != null) {
      return 'From ${CurrencyFormatter.formatVND(_minPrice!)}';
    } else if (_maxPrice != null) {
      return 'Up to ${CurrencyFormatter.formatVND(_maxPrice!)}';
    }
    return '';
  }
}

class _FilterBottomSheet extends StatefulWidget {
  final int? selectedCategoryId;
  final int? selectedBrandId;
  final double? minPrice;
  final double? maxPrice;
  final String sortBy;
  final Function(int?, int?, double?, double?, String) onApplyFilters;

  const _FilterBottomSheet({
    required this.selectedCategoryId,
    required this.selectedBrandId,
    required this.minPrice,
    required this.maxPrice,
    required this.sortBy,
    required this.onApplyFilters,
  });

  @override
  State<_FilterBottomSheet> createState() => _FilterBottomSheetState();
}

class _FilterBottomSheetState extends State<_FilterBottomSheet> {
  late int? _selectedCategoryId;
  late int? _selectedBrandId;
  late double? _minPrice;
  late double? _maxPrice;
  late String _sortBy;

  final TextEditingController _minPriceController = TextEditingController();
  final TextEditingController _maxPriceController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _selectedCategoryId = widget.selectedCategoryId;
    _selectedBrandId = widget.selectedBrandId;
    _minPrice = widget.minPrice;
    _maxPrice = widget.maxPrice;
    _sortBy = widget.sortBy;

    if (_minPrice != null) {
      _minPriceController.text = _minPrice!.toStringAsFixed(0);
    }
    if (_maxPrice != null) {
      _maxPriceController.text = _maxPrice!.toStringAsFixed(0);
    }
  }

  @override
  void dispose() {
    _minPriceController.dispose();
    _maxPriceController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppConstants.defaultPadding),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Filters',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              TextButton(
                onPressed: () {
                  setState(() {
                    _selectedCategoryId = null;
                    _selectedBrandId = null;
                    _minPrice = null;
                    _maxPrice = null;
                    _sortBy = 'name';
                    _minPriceController.clear();
                    _maxPriceController.clear();
                  });
                },
                child: const Text('Clear All'),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Category Filter
          Consumer<ProductProvider>(
            builder: (context, productProvider, child) {
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Category',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      FilterChip(
                        label: const Text('All'),
                        selected: _selectedCategoryId == null,
                        onSelected: (selected) {
                          setState(() => _selectedCategoryId = null);
                        },
                      ),
                      ...productProvider.categories.map((category) {
                        return FilterChip(
                          label: Text(category.name),
                          selected: _selectedCategoryId == category.id,
                          onSelected: (selected) {
                            setState(() {
                              _selectedCategoryId = selected ? category.id : null;
                            });
                          },
                        );
                      }),
                    ],
                  ),
                ],
              );
            },
          ),

          const SizedBox(height: 24),

          // Brand Filter
          Consumer<ProductProvider>(
            builder: (context, productProvider, child) {
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Brand',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      FilterChip(
                        label: const Text('All'),
                        selected: _selectedBrandId == null,
                        onSelected: (selected) {
                          setState(() => _selectedBrandId = null);
                        },
                      ),
                      ...productProvider.brands.map((brand) {
                        return FilterChip(
                          label: Text(brand.name),
                          selected: _selectedBrandId == brand.id,
                          onSelected: (selected) {
                            setState(() {
                              _selectedBrandId = selected ? brand.id : null;
                            });
                          },
                        );
                      }),
                    ],
                  ),
                ],
              );
            },
          ),

          const SizedBox(height: 24),

          // Price Range
          Text(
            'Price Range',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _minPriceController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Min Price',
                    prefixText: 'VND ',
                  ),
                  onChanged: (value) {
                    _minPrice = double.tryParse(value);
                  },
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: TextField(
                  controller: _maxPriceController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Max Price',
                    prefixText: 'VND ',
                  ),
                  onChanged: (value) {
                    _maxPrice = double.tryParse(value);
                  },
                ),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Sort By
          Text(
            'Sort By',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              FilterChip(
                label: const Text('Name'),
                selected: _sortBy == 'name',
                onSelected: (selected) {
                  setState(() => _sortBy = 'name');
                },
              ),
              FilterChip(
                label: const Text('Price: Low to High'),
                selected: _sortBy == 'price',
                onSelected: (selected) {
                  setState(() => _sortBy = 'price');
                },
              ),
              FilterChip(
                label: const Text('Price: High to Low'),
                selected: _sortBy == '-price',
                onSelected: (selected) {
                  setState(() => _sortBy = '-price');
                },
              ),
              FilterChip(
                label: const Text('Newest'),
                selected: _sortBy == '-createdAt',
                onSelected: (selected) {
                  setState(() => _sortBy = '-createdAt');
                },
              ),
            ],
          ),

          const SizedBox(height: 32),

          // Apply Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                widget.onApplyFilters(
                  _selectedCategoryId,
                  _selectedBrandId,
                  _minPrice,
                  _maxPrice,
                  _sortBy,
                );
                Navigator.of(context).pop();
              },
              child: const Text('Apply Filters'),
            ),
          ),

          // Safe area padding
          SizedBox(height: MediaQuery.of(context).padding.bottom),
        ],
      ),
    );
  }
}
