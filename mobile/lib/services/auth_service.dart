import 'package:flutter/foundation.dart';
import '../constants/api_constants.dart';
import '../models/user.dart';
import '../utils/storage_helper.dart';
import 'api_service.dart';

class AuthService {
  final ApiService _apiService = ApiService();
  bool _isInitialized = false;

  /// Login with username and password
  Future<User> login(String username, String password) async {
    final loginRequest = LoginRequest(
      username: username,
      password: password,
    );

    final response = await _apiService.post(
      ApiConstants.login,
      data: loginRequest.toJson(),
    );

    // Save tokens
    final tokens = AuthTokens.fromJson(response.data);
    await StorageHelper.saveAuthTokens(tokens);
    _apiService.setAuthToken(tokens.access);

    // Get user profile
    final userResponse = await _apiService.get(ApiConstants.userProfile);
    final user = User.fromJson(userResponse.data);
    
    // Save user info
    await StorageHelper.saveUserInfo(user);
    
    return user;
  }

  /// Register new user
  Future<User> register({
    required String username,
    required String email,
    required String password,
    String? firstName,
    String? lastName,
  }) async {
    final registerRequest = RegisterRequest(
      username: username,
      email: email,
      password: password,
      firstName: firstName,
      lastName: lastName,
    );

    final response = await _apiService.post(
      ApiConstants.register,
      data: registerRequest.toJson(),
    );

    // After successful registration, login automatically
    return await login(username, password);
  }

  /// Get current user profile
  Future<User> getCurrentUser() async {
    final response = await _apiService.get(ApiConstants.userProfile);
    final user = User.fromJson(response.data);
    
    // Update stored user info
    await StorageHelper.saveUserInfo(user);
    
    return user;
  }

  /// Update user profile
  Future<User> updateProfile({
    String? email,
    String? firstName,
    String? lastName,
    String? phone,
    String? gender,
    String? birthDate,
    String? address,
  }) async {
    final updateData = <String, dynamic>{};
    
    if (email != null) updateData['email'] = email;
    if (firstName != null) updateData['first_name'] = firstName;
    if (lastName != null) updateData['last_name'] = lastName;
    if (phone != null) updateData['phone'] = phone;
    if (gender != null) updateData['gender'] = gender;
    if (birthDate != null) updateData['birth_date'] = birthDate;
    if (address != null) updateData['address'] = address;

    final response = await _apiService.patch(
      ApiConstants.userProfile,
      data: updateData,
    );

    final user = User.fromJson(response.data);
    
    // Update stored user info
    await StorageHelper.saveUserInfo(user);
    
    return user;
  }

  /// Change password
  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await _apiService.post(
      '${ApiConstants.authPrefix}/users/set_password/',
      data: {
        'current_password': currentPassword,
        'new_password': newPassword,
      },
    );
  }

  /// Refresh access token
  Future<bool> refreshToken() async {
    try {
      final tokens = StorageHelper.getAuthTokens();
      if (tokens == null) return false;

      final response = await _apiService.post(
        ApiConstants.refreshToken,
        data: {'refresh': tokens.refresh},
      );

      final newTokens = AuthTokens.fromJson(response.data);
      await StorageHelper.saveAuthTokens(newTokens);
      _apiService.setAuthToken(newTokens.access);
      
      return true;
    } catch (e) {
      return false;
    }
  }

  /// Logout user
  Future<void> logout() async {
    try {
      // Try to blacklist the token on server
      final tokens = StorageHelper.getAuthTokens();
      if (tokens != null) {
        await _apiService.post(
          '${ApiConstants.authPrefix}/jwt/blacklist/',
          data: {'refresh': tokens.refresh},
        );
      }
    } catch (e) {
      // Ignore errors during logout
    } finally {
      // Clear local data
      await StorageHelper.clearUserData();
      _apiService.clearAuthToken();
    }
  }

  /// Check if user is logged in
  bool get isLoggedIn => StorageHelper.isLoggedIn;

  /// Get stored user info
  User? get currentUser => StorageHelper.getUserInfo();

  /// Check if current user is admin
  bool get isAdmin => currentUser?.isAdmin ?? false;

  /// Validate email format
  bool isValidEmail(String email) {
    return RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$').hasMatch(email);
  }

  /// Validate password strength
  bool isValidPassword(String password) {
    return password.length >= 6;
  }

  /// Validate username
  bool isValidUsername(String username) {
    return username.length >= 3 && username.length <= 30;
  }

  /// Initialize auth service (load saved tokens)
  Future<void> initialize() async {
    if (_isInitialized) {
      debugPrint('AuthService: Already initialized, skipping');
      return;
    }

    debugPrint('AuthService: Initializing...');
    _isInitialized = true;

    final tokens = StorageHelper.getAuthTokens();
    if (tokens != null) {
      _apiService.setAuthToken(tokens.access);

      // Try to get current user to validate token
      try {
        debugPrint('AuthService: Getting current user to validate token');
        await getCurrentUser();
        debugPrint('AuthService: Token validation successful');
      } catch (e) {
        debugPrint('AuthService: Token validation failed: $e');
        // If getting user fails, try to refresh token
        final refreshed = await refreshToken();
        if (!refreshed) {
          debugPrint('AuthService: Token refresh failed, logging out');
          // If refresh fails, logout
          await logout();
        } else {
          debugPrint('AuthService: Token refresh successful');
        }
      }
    } else {
      debugPrint('AuthService: No saved tokens found');
    }
  }

  /// Reset password (if implemented on backend)
  Future<void> resetPassword(String email) async {
    await _apiService.post(
      '${ApiConstants.authPrefix}/users/reset_password/',
      data: {'email': email},
    );
  }

  /// Confirm password reset (if implemented on backend)
  Future<void> confirmPasswordReset({
    required String uid,
    required String token,
    required String newPassword,
  }) async {
    await _apiService.post(
      '${ApiConstants.authPrefix}/users/reset_password_confirm/',
      data: {
        'uid': uid,
        'token': token,
        'new_password': newPassword,
      },
    );
  }
}
