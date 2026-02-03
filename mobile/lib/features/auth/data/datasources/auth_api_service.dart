import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';
import 'package:retrofit/retrofit.dart';
import '../models/auth_response_model.dart';
import '../models/login_request_model.dart';
import '../models/register_request_model.dart';

part 'auth_api_service.g.dart';

@lazySingleton
@RestApi(baseUrl: '/auth')
abstract class AuthApiService {
  @factoryMethod
  factory AuthApiService(Dio dio) = _AuthApiService;

  @POST('/register')
  Future<AuthResponseModel> register(@Body() RegisterRequestModel request);

  @POST('/login')
  Future<AuthResponseModel> login(@Body() LoginRequestModel request);

  @POST('/refresh')
  Future<AuthResponseModel> refreshToken(@Body() Map<String, dynamic> body);

  @POST('/logout')
  Future<void> logout();

  @PUT('/profile')
  Future<AuthResponseModel> updateProfile(@Body() Map<String, dynamic> body);
}
