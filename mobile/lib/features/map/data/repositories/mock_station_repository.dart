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
        name: 'Agil Ariana',
        address: 'Av. de la Terre (Route X), Ariana',
        location: const Location(latitude: 36.8550, longitude: 10.1963),
        status: StationStatus.available,
        rating: 4.5,
        pricePerKwh: 0.800, // TND
        connectorTypes: ['Type 2', 'CCS2'],
      ),
      Station(
        id: '2',
        name: 'TotalEnergies Berges du Lac',
        address: 'Rue du Lac Lochness, Les Berges du Lac',
        location: const Location(latitude: 36.8346, longitude: 10.2359),
        status: StationStatus.busy,
        rating: 4.8,
        pricePerKwh: 0.0, // Free
        connectorTypes: ['CCS2', 'CHAdeMO'],
      ),
      Station(
        id: '3',
        name: 'Shell Centre Ville',
        address: 'Avenue Habib Bourguiba, Tunis',
        location: const Location(latitude: 36.8008, longitude: 10.1800),
        status: StationStatus.offline,
        rating: 3.9,
        pricePerKwh: 0.750,
        connectorTypes: ['Type 2'],
      ),
       Station(
        id: '4',
        name: 'OiLibya La Marsa',
        address: 'Route de la Marsa, La Marsa',
        location: const Location(latitude: 36.8790, longitude: 10.3240),
        status: StationStatus.available,
        rating: 4.2,
        pricePerKwh: 0.850,
        connectorTypes: ['Type 2', 'CCS2'],
      ),
      Station(
        id: '5',
        name: 'StarOil Charguia',
        address: 'Zone Industrielle Charguia 1',
        location: const Location(latitude: 36.8450, longitude: 10.2100),
        status: StationStatus.available,
        rating: 4.0,
        pricePerKwh: 0.600,
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
