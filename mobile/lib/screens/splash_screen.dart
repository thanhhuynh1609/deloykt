import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../constants/app_constants.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../providers/product_provider.dart';
import '../providers/paybox_provider.dart';
import '../providers/favorite_provider.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    try {
      // Initialize all providers
      final authProvider = context.read<AuthProvider>();
      final cartProvider = context.read<CartProvider>();
      final productProvider = context.read<ProductProvider>();
      final payboxProvider = context.read<PayboxProvider>();
      final favoriteProvider = context.read<FavoriteProvider>();

      // Initialize auth first
      await authProvider.initialize();

      // Initialize only essential providers to avoid infinite API calls
      await Future.wait([
        cartProvider.initialize(),
        favoriteProvider.initialize(),
        // Skip ProductProvider and PayboxProvider initialization here
        // They will be initialized lazily when needed
      ]);

      // Navigate based on auth status
      if (mounted) {
        if (authProvider.isLoggedIn) {
          context.go('/home');
        } else {
          context.go('/login');
        }
      }
    } catch (e) {
      // Handle initialization error
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Initialization failed: ${e.toString()}'),
            backgroundColor: AppConstants.errorColor,
          ),
        );
        context.go('/login');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.primaryColor,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // App Logo
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: const Icon(
                Icons.shopping_bag,
                size: 60,
                color: AppConstants.primaryColor,
              ),
            ),
            
            const SizedBox(height: 24),
            
            // App Name
            const Text(
              AppConstants.appName,
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            
            const SizedBox(height: 8),
            
            // App Version
            const Text(
              'Version ${AppConstants.appVersion}',
              style: TextStyle(
                fontSize: 16,
                color: Colors.white70,
              ),
            ),
            
            const SizedBox(height: 48),
            
            // Loading Indicator
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
            ),
            
            const SizedBox(height: 16),
            
            // Loading Text
            const Text(
              'Loading...',
              style: TextStyle(
                fontSize: 16,
                color: Colors.white70,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
