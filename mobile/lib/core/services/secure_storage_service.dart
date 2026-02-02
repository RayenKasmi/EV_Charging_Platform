import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:injectable/injectable.dart';

@singleton
class SecureStorageService {
  final FlutterSecureStorage _secureStorage;

  SecureStorageService(this._secureStorage);

  // Keys
  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _userIdKey = 'user_id';
  static const String _userEmailKey = 'user_email';
  static const String _userFullNameKey = 'user_full_name';

  // Save tokens
  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await Future.wait([
      _secureStorage.write(key: _accessTokenKey, value: accessToken),
      _secureStorage.write(key: _refreshTokenKey, value: refreshToken),
    ]);
  }

  // Get access token
  Future<String?> getAccessToken() async {
    return await _secureStorage.read(key: _accessTokenKey);
  }

  // Get refresh token
  Future<String?> getRefreshToken() async {
    return await _secureStorage.read(key: _refreshTokenKey);
  }

  // Save user data
  Future<void> saveUserData({
    required String userId,
    required String email,
    required String fullName,
  }) async {
    await Future.wait([
      _secureStorage.write(key: _userIdKey, value: userId),
      _secureStorage.write(key: _userEmailKey, value: email),
      _secureStorage.write(key: _userFullNameKey, value: fullName),
    ]);
  }

  // Get user ID
  Future<String?> getUserId() async {
    return await _secureStorage.read(key: _userIdKey);
  }

  // Get user email
  Future<String?> getUserEmail() async {
    return await _secureStorage.read(key: _userEmailKey);
  }

  // Get user full name
  Future<String?> getUserFullName() async {
    return await _secureStorage.read(key: _userFullNameKey);
  }

  // Check if user is authenticated
  Future<bool> isAuthenticated() async {
    final accessToken = await getAccessToken();
    return accessToken != null && accessToken.isNotEmpty;
  }

  // Clear all data (logout)
  Future<void> clearAll() async {
    await _secureStorage.deleteAll();
  }

  // Delete specific keys
  Future<void> deleteTokens() async {
    await Future.wait([
      _secureStorage.delete(key: _accessTokenKey),
      _secureStorage.delete(key: _refreshTokenKey),
    ]);
  }
}
