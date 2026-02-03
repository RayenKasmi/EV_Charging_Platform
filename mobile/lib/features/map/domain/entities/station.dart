import 'location.dart';

enum StationStatus { available, busy, offline }

class Station {
  final String id;
  final String name;
  final String address;
  final Location location;
  final StationStatus status;
  final double rating;
  final double pricePerKwh;
  final List<String> connectorTypes; // e.g., ["Type 2", "CCS2"]

  const Station({
    required this.id,
    required this.name,
    required this.address,
    required this.location,
    required this.status,
    required this.rating,
    required this.pricePerKwh,
    required this.connectorTypes,
  });
}
