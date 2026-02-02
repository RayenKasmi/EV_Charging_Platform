import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';
import '../services/secure_storage_service.dart';

@singleton
class AuthInterceptor extends Interceptor {
  final SecureStorageService _storageService;
  final Dio _dio;

  AuthInterceptor(this._storageService, @Named('authDio') this._dio);

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Add access token to headers
    final accessToken = await _storageService.getAccessToken();
    if (accessToken != null) {
      options.headers['Authorization'] = 'Bearer $accessToken';
    }

    return handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    // Don't intercept auth-related endpoints
    final path = err.requestOptions.path;
    if (path.contains('/auth/login') ||
        path.contains('/auth/register') ||
        path.contains('/auth/logout') ||
        path.contains('/auth/refresh')) {
      return handler.next(err);
    }

    // If 401 unauthorized, try to refresh token
    if (err.response?.statusCode == 401) {
      try {
        // Try to refresh the token
        final refreshToken = await _storageService.getRefreshToken();

        if (refreshToken != null) {
          final response = await _dio.post(
            'http://10.0.2.2:3000/auth/refresh',
            data: {'refreshToken': refreshToken},
          );

          if (response.statusCode == 200) {
            final newAccessToken = response.data['accessToken'];
            final newRefreshToken = response.data['refreshToken'];

            // Save new tokens
            await _storageService.saveTokens(
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            );

            // Retry the original request with new token
            final opts = err.requestOptions;
            opts.headers['Authorization'] = 'Bearer $newAccessToken';

            final cloneReq = await _dio.request(
              opts.path,
              options: Options(
                method: opts.method,
                headers: opts.headers,
              ),
              data: opts.data,
              queryParameters: opts.queryParameters,
            );

            return handler.resolve(cloneReq);
          }
        }
      } catch (e) {
        // If refresh fails, clear tokens and proceed with error
        await _storageService.clearAll();
      }
    }

    return handler.next(err);
  }
}
