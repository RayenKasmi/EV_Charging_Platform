part of 'map_bloc.dart';

abstract class MapEvent extends Equatable {
  const MapEvent();

  @override
  List<Object?> get props => [];
}

class LoadMapStations extends MapEvent {}

class FilterMapStations extends MapEvent {
  final String? connectorType;
  final StationStatus? status;
  final String? query;

  const FilterMapStations({this.connectorType, this.status, this.query});

  @override
  List<Object?> get props => [connectorType, status, query];
}

class SelectStation extends MapEvent {
  final String stationId;
  const SelectStation(this.stationId);
}
