import 'package:injectable/injectable.dart';
import '../../domain/entities/location.dart';
import '../../domain/entities/station.dart';
import '../../domain/repositories/station_repository.dart';

@LazySingleton(as: StationRepository)
class MockStationRepository implements StationRepository {
  @override
  Future<List<Station>> getStations() async {
    await Future.delayed(const Duration(seconds: 1)); // Simulate network delay
    return [
      Station(
        id: '1',
        name: 'EcoCharge Downtown',
        address: '123 Green St, City Center',
        location: const Location(latitude: 37.7749, longitude: -122.4194), // San Francisco
        status: StationStatus.available,
        rating: 4.5,
        pricePerKwh: 0.35,
        connectorTypes: ['Type 2', 'CCS2'],
      ),
      Station(
        id: '2',
        name: 'SuperFast Hub',
        address: '45 Tech Park Blvd',
        location: const Location(latitude: 37.7849, longitude: -122.4094),
        status: StationStatus.busy,
        rating: 4.8,
        pricePerKwh: 0.45,
        connectorTypes: ['CCS2', 'CHAdeMO'],
      ),
      Station(
        id: '3',
        name: 'Mall EV Spot',
        address: '88 Shopping Ln',
        location: const Location(latitude: 37.7649, longitude: -122.4294),
        status: StationStatus.offline,
        rating: 3.9,
        pricePerKwh: 0.25,
        connectorTypes: ['Type 2'],
      ),
       Station(
        id: '4',
        name: 'Ocean Beach Charger',
        address: 'Great Hwy',
        location: const Location(latitude: 37.7549, longitude: -122.5094),
        status: StationStatus.available,
        rating: 4.2,
        pricePerKwh: 0.30,
        connectorTypes: ['Type 2'],
      ),
    ];
  }

  @override
  Future<Station> getStationById(String id) async {
    await Future.delayed(const Duration(milliseconds: 500));
    return (await getStations()).firstWhere((s) => s.id == id);
  }
}
