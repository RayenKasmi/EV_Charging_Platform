import 'package:hive_flutter/hive_flutter.dart';

class LocalStorage {
  static const String _authBox = 'authBox';
  static const String _dataBox = 'dataBox';
  static const String _settingsBox = 'settingsBox';

  // Initialize Hive
  static Future<void> init() async {
    await Hive.initFlutter();
    await Hive.openBox(_authBox);
    await Hive.openBox(_dataBox);
    await Hive.openBox(_settingsBox);
  }

  // Token Management
  Future<void> saveToken(String token) async {
    final box = Hive.box(_authBox);
    await box.put('token', token);
  }

  Future<String?> getToken() async {
    final box = Hive.box(_authBox);
    return box.get('token');
  }

  Future<void> deleteToken() async {
    final box = Hive.box(_authBox);
    await box.delete('token');
  }

  // Generic Data Storage
  Future<void> saveData(String key, dynamic value) async {
    final box = Hive.box(_dataBox);
    await box.put(key, value);
  }

  Future<T?> getData<T>(String key) async {
    final box = Hive.box(_dataBox);
    return box.get(key) as T?;
  }

  Future<void> deleteData(String key) async {
    final box = Hive.box(_dataBox);
    await box.delete(key);
  }

  // Settings Storage
  Future<void> saveSetting(String key, dynamic value) async {
    final box = Hive.box(_settingsBox);
    await box.put(key, value);
  }

  Future<T?> getSetting<T>(String key) async {
    final box = Hive.box(_settingsBox);
    return box.get(key) as T?;
  }

  // Clear All Data
  Future<void> clearAll() async {
    await Hive.box(_authBox).clear();
    await Hive.box(_dataBox).clear();
    await Hive.box(_settingsBox).clear();
  }
}