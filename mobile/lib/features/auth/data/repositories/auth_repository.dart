import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/services/secure_storage_service.dart';
import '../datasources/auth_api_service.dart';
import '../models/auth_response_model.dart';
import '../models/login_request_model.dart';
import '../models/register_request_model.dart';
import '../models/user_model.dart';

@singleton
class AuthRepository {
  final AuthApiService _apiService;
  final SecureStorageService _storageService;

  AuthRepository(this._apiService, this._storageService);

  Future<Either<Failure, AuthResponseModel>> login(
      LoginRequestModel request) async {
    try {
      final response = await _apiService.login(request);
      
      // Save tokens
      await _storageService.saveTokens(
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      );

      // Save user data
      await _storageService.saveUserData(
        userId: response.user.id,
        email: response.user.email,
        fullName: response.user.fullName,
      );

      return Right(response);
    } on DioException catch (e) {
      return Left(_handleDioError(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  Future<Either<Failure, AuthResponseModel>> register(
      RegisterRequestModel request) async {
    try {
      final response = await _apiService.register(request);
      
      // Save tokens
      await _storageService.saveTokens(
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      );

      // Save user data
      await _storageService.saveUserData(
        userId: response.user.id,
        email: response.user.email,
        fullName: response.user.fullName,
      );

      return Right(response);
    } on DioException catch (e) {
      return Left(_handleDioError(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  Future<Either<Failure, AuthResponseModel>> refreshToken() async {
    try {
      final refreshToken = await _storageService.getRefreshToken();
      
      if (refreshToken == null) {
        return Left(CacheFailure(message: 'No refresh token found'));
      }

      final response = await _apiService.refreshToken({
        'refreshToken': refreshToken,
      });

      // Update tokens
      await _storageService.saveTokens(
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      );

      return Right(response);
    } on DioException catch (e) {
      return Left(_handleDioError(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  Future<Either<Failure, void>> logout() async {
    try {
      await _apiService.logout();
      await _storageService.clearAll();
      return const Right(null);
    } on DioException catch (e) {
      // Even if logout fails on server, clear local data
      await _storageService.clearAll();
      return Left(_handleDioError(e));
    } catch (e) {
      await _storageService.clearAll();
      return Left(ServerFailure(message: e.toString()));
    }
  }

  Future<bool> isAuthenticated() async {
    return await _storageService.isAuthenticated();
  }

  Future<UserModel?> getCurrentUser() async {
    final userId = await _storageService.getUserId();
    final email = await _storageService.getUserEmail();
    final fullName = await _storageService.getUserFullName();

    if (userId == null || email == null || fullName == null) {
      return null;
    }

    return UserModel(
      id: userId,
      email: email,
      fullName: fullName,
    );
  }

  Failure _handleDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return NetworkFailure(message: 'Connection timeout');
      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        final responseData = error.response?.data;
        
        // Extract message from response - can be string or map
        String message = 'Server error';
        if (responseData != null) {
          if (responseData is Map<String, dynamic>) {
            final messageField = responseData['message'];
            if (messageField is String) {
              message = messageField;
            } else if (messageField is Map<String, dynamic>) {
              // Backend returns message as object like {message: "...", error: "...", statusCode: 401}
              message = messageField['message']?.toString() ?? 
                        messageField['error']?.toString() ?? 
                        'Server error';
            }
          } else if (responseData is String) {
            message = responseData;
          }
        }
        
        if (statusCode == 401) {
          return UnauthorizedFailure(message: message);
        } else if (statusCode == 409) {
          return ConflictFailure(message: message);
        }
        return ServerFailure(message: message);
      case DioExceptionType.cancel:
        return ServerFailure(message: 'Request cancelled');
      case DioExceptionType.unknown:
        return NetworkFailure(message: 'No internet connection');
      default:
        return ServerFailure(message: 'An error occurred');
    }
  }
}
