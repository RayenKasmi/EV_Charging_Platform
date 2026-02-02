part of 'map_bloc.dart';

abstract class MapState extends Equatable {
  const MapState();
  
  @override
  List<Object?> get props => [];
}

class MapInitial extends MapState {}

class MapLoading extends MapState {}

class MapLoaded extends MapState {
  final List<Station> stations;
  final List<Station> filteredStations;
  // Can add current user location here

  const MapLoaded({required this.stations, required this.filteredStations});

  @override
  List<Object?> get props => [stations, filteredStations];
}

class MapError extends MapState {
  final String message;
  const MapError(this.message);

    @override
  List<Object?> get props => [message];
}

class MapStationSelected extends MapState {
  final Station station;
  const MapStationSelected(this.station);

  @override
  List<Object?> get props => [station];
}
