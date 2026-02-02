part of 'map_bloc.dart';

abstract class MapEvent extends Equatable {
  const MapEvent();

  @override
  List<Object> get props => [];
}

class LoadMapStations extends MapEvent {}

class FilterMapStations extends MapEvent {
  final String? connectorType;
  final StationStatus? status;

  const FilterMapStations({this.connectorType, this.status});
}

class SelectStation extends MapEvent {
  final String stationId;
  const SelectStation(this.stationId);
}
