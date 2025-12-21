import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
/*
import '../../features/auth/models/user_model.dart';
import '../../features/auth/models/login_request.dart';
import '../../features/stations/models/station_model.dart';
import '../../features/bookings/models/booking_model.dart';
*/
part 'api_client.g.dart';

@RestApi(baseUrl: "https://localhost:3000")
abstract class ApiClient {
  factory ApiClient(Dio dio, {String baseUrl}) = _ApiClient;
// TODO: Team adds API endpoints here
  // Example:
  // @GET('/stations')
  // Future<List<StationModel>> getStations();
  
  // @POST('/bookings')
  // Future<BookingModel> createBooking(@Body() Map<String, dynamic> data);
}