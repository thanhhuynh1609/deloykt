import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../constants/api_constants.dart';
import '../constants/app_constants.dart';
import '../utils/storage_helper.dart';
import '../models/user.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  late Dio _dio;
  String? _accessToken;

  void initialize() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: AppConstants.connectTimeout,
      receiveTimeout: AppConstants.receiveTimeout,
      sendTimeout: AppConstants.apiTimeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    // Add interceptors
    _dio.interceptors.add(LogInterceptor(
      requestBody: kDebugMode,
      responseBody: kDebugMode,
      requestHeader: kDebugMode,
      responseHeader: false,
      error: kDebugMode,
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        // Add auth token if available
        if (_accessToken != null) {
          options.headers['Authorization'] = 'JWT $_accessToken';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        // Handle token refresh on 401
        if (error.response?.statusCode == 401) {
          final refreshed = await _refreshToken();
          if (refreshed) {
            // Retry the original request
            final options = error.requestOptions;
            options.headers['Authorization'] = 'JWT $_accessToken';
            try {
              final response = await _dio.fetch(options);
              handler.resolve(response);
              return;
            } catch (e) {
              // If retry fails, continue with original error
            }
          }
        }
        handler.next(error);
      },
    ));

    // Load saved token
    _loadSavedToken();
  }

  void _loadSavedToken() {
    final tokens = StorageHelper.getAuthTokens();
    if (tokens != null) {
      _accessToken = tokens.access;
    }
  }

  Future<bool> _refreshToken() async {
    try {
      final tokens = StorageHelper.getAuthTokens();
      if (tokens == null) return false;

      final response = await _dio.post(
        ApiConstants.refreshToken,
        data: {'refresh': tokens.refresh},
      );

      if (response.statusCode == 200) {
        final newTokens = AuthTokens.fromJson(response.data);
        await StorageHelper.saveAuthTokens(newTokens);
        _accessToken = newTokens.access;
        return true;
      }
    } catch (e) {
      debugPrint('Token refresh failed: $e');
      // Clear invalid tokens
      await StorageHelper.clearAuthTokens();
      await StorageHelper.clearUserInfo();
      _accessToken = null;
    }
    return false;
  }

  void setAuthToken(String token) {
    _accessToken = token;
  }

  void clearAuthToken() {
    _accessToken = null;
  }

  // Generic HTTP methods
  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.get<T>(
        path,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.post<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.put<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Response<T>> patch<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.patch<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.delete<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  // Upload file
  Future<Response<T>> uploadFile<T>(
    String path,
    File file, {
    String fieldName = 'file',
    Map<String, dynamic>? data,
    ProgressCallback? onSendProgress,
  }) async {
    try {
      final formData = FormData();
      
      if (data != null) {
        formData.fields.addAll(data.entries.map((e) => MapEntry(e.key, e.value.toString())));
      }
      
      formData.files.add(MapEntry(
        fieldName,
        await MultipartFile.fromFile(file.path),
      ));

      return await _dio.post<T>(
        path,
        data: formData,
        onSendProgress: onSendProgress,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  ApiException _handleDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return ApiException(
          message: AppConstants.networkErrorMessage,
          statusCode: null,
          type: ApiExceptionType.timeout,
        );
      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        String message = AppConstants.serverErrorMessage;
        
        if (error.response?.data != null) {
          try {
            final data = error.response!.data;
            if (data is Map<String, dynamic>) {
              message = data['error'] ?? data['detail'] ?? data['message'] ?? message;
            } else if (data is String) {
              message = data;
            }
          } catch (e) {
            // Use default message
          }
        }
        
        return ApiException(
          message: message,
          statusCode: statusCode,
          type: statusCode == 401 
            ? ApiExceptionType.unauthorized
            : ApiExceptionType.serverError,
        );
      case DioExceptionType.cancel:
        return ApiException(
          message: 'Request was cancelled',
          statusCode: null,
          type: ApiExceptionType.cancel,
        );
      case DioExceptionType.unknown:
      default:
        return ApiException(
          message: AppConstants.unknownErrorMessage,
          statusCode: null,
          type: ApiExceptionType.unknown,
        );
    }
  }
}

enum ApiExceptionType {
  timeout,
  serverError,
  unauthorized,
  cancel,
  unknown,
}

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final ApiExceptionType type;

  ApiException({
    required this.message,
    this.statusCode,
    required this.type,
  });

  @override
  String toString() => message;
}
