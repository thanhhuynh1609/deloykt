import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../utils/storage_helper.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();

  User? _user;
  bool _isLoading = false;
  String? _error;
  bool _isInitialized = false;

  // Getters
  User? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isLoggedIn => _user != null;
  bool get isAdmin => _user?.isAdmin ?? false;

  // Initialize auth provider
  Future<void> initialize() async {
    if (_isInitialized) {
      debugPrint('AuthProvider: Already initialized, skipping');
      return;
    }

    debugPrint('AuthProvider: Initializing...');
    _isInitialized = true;
    _setLoading(true);

    try {
      await StorageHelper.init();
      await _authService.initialize();
      _user = _authService.currentUser;
      debugPrint('AuthProvider: Initialization successful, user: ${_user?.username}');
      _clearError();
    } catch (e) {
      debugPrint('AuthProvider: Initialization failed: $e');
      _setError('Failed to initialize auth: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // Login
  Future<bool> login(String username, String password) async {
    _setLoading(true);
    _clearError();
    
    try {
      _user = await _authService.login(username, password);
      _clearError();
      notifyListeners();
      return true;
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Register
  Future<bool> register({
    required String username,
    required String email,
    required String password,
    String? firstName,
    String? lastName,
  }) async {
    _setLoading(true);
    _clearError();
    
    try {
      _user = await _authService.register(
        username: username,
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
      );
      _clearError();
      notifyListeners();
      return true;
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Update profile
  Future<bool> updateProfile({
    String? email,
    String? firstName,
    String? lastName,
    String? phone,
    String? gender,
    String? birthDate,
    String? address,
  }) async {
    _setLoading(true);
    _clearError();
    
    try {
      _user = await _authService.updateProfile(
        email: email,
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        gender: gender,
        birthDate: birthDate,
        address: address,
      );
      _clearError();
      notifyListeners();
      return true;
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Change password
  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    _setLoading(true);
    _clearError();
    
    try {
      await _authService.changePassword(
        currentPassword: currentPassword,
        newPassword: newPassword,
      );
      _clearError();
      return true;
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Refresh user data
  Future<void> refreshUser() async {
    if (!isLoggedIn) return;
    
    try {
      _user = await _authService.getCurrentUser();
      notifyListeners();
    } catch (e) {
      _setError(e.toString());
    }
  }

  // Logout
  Future<void> logout() async {
    _setLoading(true);
    try {
      await _authService.logout();
      _user = null;
      _clearError();
      notifyListeners();
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  // Reset password
  Future<bool> resetPassword(String email) async {
    _setLoading(true);
    _clearError();
    
    try {
      await _authService.resetPassword(email);
      _clearError();
      return true;
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Validation methods
  bool isValidEmail(String email) => _authService.isValidEmail(email);
  bool isValidPassword(String password) => _authService.isValidPassword(password);
  bool isValidUsername(String username) => _authService.isValidUsername(username);

  // Private helper methods
  void _setLoading(bool loading) {
    _isLoading = loading;
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

  // Clear error manually
  void clearError() {
    _clearError();
  }

  // Check if user has specific permissions
  bool hasPermission(String permission) {
    if (!isLoggedIn) return false;
    if (isAdmin) return true;
    
    // Add specific permission checks here if needed
    return false;
  }

  // Get user display name
  String get userDisplayName {
    if (_user == null) return '';
    return _user!.fullName;
  }

  // Get user initials for avatar
  String get userInitials {
    if (_user == null) return '';
    final name = _user!.fullName;
    if (name.isEmpty) return _user!.username.substring(0, 1).toUpperCase();
    
    final parts = name.split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    } else {
      return parts[0][0].toUpperCase();
    }
  }

  // Check if profile is complete
  bool get isProfileComplete {
    if (_user == null) return false;
    return _user!.firstName != null && 
           _user!.lastName != null && 
           _user!.phone != null && 
           _user!.address != null;
  }

  // Get profile completion percentage
  double get profileCompletionPercentage {
    if (_user == null) return 0.0;
    
    int completedFields = 0;
    int totalFields = 6; // email, firstName, lastName, phone, address, gender
    
    if (_user!.email.isNotEmpty) completedFields++;
    if (_user!.firstName != null && _user!.firstName!.isNotEmpty) completedFields++;
    if (_user!.lastName != null && _user!.lastName!.isNotEmpty) completedFields++;
    if (_user!.phone != null && _user!.phone!.isNotEmpty) completedFields++;
    if (_user!.address != null && _user!.address!.isNotEmpty) completedFields++;
    if (_user!.gender != null && _user!.gender!.isNotEmpty) completedFields++;
    
    return completedFields / totalFields;
  }
}
