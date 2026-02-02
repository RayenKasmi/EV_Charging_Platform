class ApiConstants {
  // Base URL - Change this to your backend URL
  static const String baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );

  // Timeout durations
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);

  // API Endpoints - Add your endpoints here
  static const String auth = '/auth';
  static const String stations = '/stations';
  static const String bookings = '/bookings';
  static const String profile = '/profile';
}