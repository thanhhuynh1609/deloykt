import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../constants/app_constants.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/paybox_provider.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/home'),
        ),
      ),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          final user = authProvider.user;
          if (user == null) {
            return const Center(child: Text('User not found'));
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(AppConstants.defaultPadding),
            child: Column(
              children: [
                // Profile Header
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(AppConstants.defaultPadding),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 40,
                          backgroundColor: AppConstants.primaryColor,
                          child: user.avatar != null
                              ? ClipOval(
                                  child: Image.network(
                                    user.avatar!,
                                    width: 80,
                                    height: 80,
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, error, stackTrace) {
                                      return Text(
                                        authProvider.userInitials,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 24,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      );
                                    },
                                  ),
                                )
                              : Text(
                                  authProvider.userInitials,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                authProvider.userDisplayName,
                                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                user.email,
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: AppConstants.textSecondaryColor,
                                ),
                              ),
                              if (user.isAdmin) ...[
                                const SizedBox(height: 4),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppConstants.warningColor,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Text(
                                    'Admin',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // Profile Completion
                if (!authProvider.isProfileComplete) ...[
                  Card(
                    color: AppConstants.warningColor.withOpacity(0.1),
                    child: Padding(
                      padding: const EdgeInsets.all(AppConstants.defaultPadding),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(
                                Icons.info_outline,
                                color: AppConstants.warningColor,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Complete Your Profile',
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          LinearProgressIndicator(
                            value: authProvider.profileCompletionPercentage,
                            backgroundColor: Colors.grey[300],
                            valueColor: const AlwaysStoppedAnimation<Color>(
                              AppConstants.warningColor,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            '${(authProvider.profileCompletionPercentage * 100).toInt()}% complete',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Paybox Wallet
                Card(
                  child: ListTile(
                    leading: const Icon(
                      Icons.account_balance_wallet,
                      color: AppConstants.primaryColor,
                    ),
                    title: const Text('Paybox Wallet'),
                    subtitle: const Text('Tap to view balance'),
                    trailing: const Icon(Icons.arrow_forward_ios),
                    onTap: () => context.go('/paybox'),
                  ),
                ),

                const SizedBox(height: 16),

                // Menu Items
                Card(
                  child: Column(
                    children: [
                      _buildMenuItem(
                        context,
                        icon: Icons.edit,
                        title: 'Edit Profile',
                        onTap: () {
                          // TODO: Navigate to edit profile
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Edit profile feature coming soon!'),
                            ),
                          );
                        },
                      ),
                      const Divider(height: 1),
                      _buildMenuItem(
                        context,
                        icon: Icons.shopping_bag,
                        title: 'My Orders',
                        onTap: () {
                          // TODO: Navigate to orders
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Orders feature coming soon!'),
                            ),
                          );
                        },
                      ),
                      const Divider(height: 1),
                      _buildMenuItem(
                        context,
                        icon: Icons.favorite,
                        title: 'Favorites',
                        onTap: () {
                          // TODO: Navigate to favorites
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Favorites feature coming soon!'),
                            ),
                          );
                        },
                      ),
                      const Divider(height: 1),
                      _buildMenuItem(
                        context,
                        icon: Icons.location_on,
                        title: 'Addresses',
                        onTap: () {
                          // TODO: Navigate to addresses
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Addresses feature coming soon!'),
                            ),
                          );
                        },
                      ),
                      const Divider(height: 1),
                      _buildMenuItem(
                        context,
                        icon: Icons.payment,
                        title: 'Payment Methods',
                        onTap: () {
                          // TODO: Navigate to payment methods
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Payment methods feature coming soon!'),
                            ),
                          );
                        },
                      ),
                      const Divider(height: 1),
                      _buildMenuItem(
                        context,
                        icon: Icons.settings,
                        title: 'Settings',
                        onTap: () {
                          // TODO: Navigate to settings
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Settings feature coming soon!'),
                            ),
                          );
                        },
                      ),
                      const Divider(height: 1),
                      _buildMenuItem(
                        context,
                        icon: Icons.help,
                        title: 'Help & Support',
                        onTap: () {
                          // TODO: Navigate to help
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Help feature coming soon!'),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Logout Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () async {
                      final confirmed = await showDialog<bool>(
                        context: context,
                        builder: (context) => AlertDialog(
                          title: const Text('Logout'),
                          content: const Text('Are you sure you want to logout?'),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.of(context).pop(false),
                              child: const Text('Cancel'),
                            ),
                            ElevatedButton(
                              onPressed: () => Navigator.of(context).pop(true),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppConstants.errorColor,
                              ),
                              child: const Text('Logout'),
                            ),
                          ],
                        ),
                      );

                      if (confirmed == true && context.mounted) {
                        await authProvider.logout();
                        await context.read<CartProvider>().clearCart();
                        context.go('/login');
                      }
                    },
                    icon: const Icon(Icons.logout),
                    label: const Text('Logout'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppConstants.errorColor,
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // App Version
                Text(
                  'Version ${AppConstants.appVersion}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppConstants.textSecondaryColor,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildMenuItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: AppConstants.textSecondaryColor),
      title: Text(title),
      trailing: const Icon(
        Icons.arrow_forward_ios,
        size: 16,
        color: AppConstants.textSecondaryColor,
      ),
      onTap: onTap,
    );
  }
}
