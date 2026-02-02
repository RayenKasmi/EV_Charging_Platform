import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';
import '../../domain/entities/station.dart';
import '../../domain/repositories/station_repository.dart';

part 'map_event.dart';
part 'map_state.dart';

@injectable
class MapBloc extends Bloc<MapEvent, MapState> {
  final StationRepository _stationRepository;

  MapBloc(this._stationRepository) : super(MapInitial()) {
    on<LoadMapStations>(_onLoadMapStations);
    on<FilterMapStations>(_onFilterMapStations);
    on<SelectStation>(_onSelectStation);
  }

  Future<void> _onLoadMapStations(
      LoadMapStations event, Emitter<MapState> emit) async {
    emit(MapLoading());
    try {
      final stations = await _stationRepository.getStations();
      emit(MapLoaded(stations: stations, filteredStations: stations));
    } catch (e) {
      emit(MapError("Failed to load stations: $e"));
    }
  }

  void _onFilterMapStations(FilterMapStations event, Emitter<MapState> emit) {
    if (state is MapLoaded) {
      final currentState = state as MapLoaded;
      
      final filtered = currentState.stations.where((station) {
        bool matchesType = event.connectorType == null ||
            station.connectorTypes.contains(event.connectorType);
        bool matchesStatus = event.status == null || station.status == event.status;
        return matchesType && matchesStatus;
      }).toList();

      emit(MapLoaded(stations: currentState.stations, filteredStations: filtered));
    }
  }

  Future<void> _onSelectStation(SelectStation event, Emitter<MapState> emit) async {
     try {
      final station = await _stationRepository.getStationById(event.stationId);
      emit(MapStationSelected(station));
       // After selection, we might want to revert to loaded or keep it selected. 
       // Often simpler to just emit Loaded again with a selectedId property, 
       // but for now this handles the "Event" of selection.
    } catch (e) {
       // handle error
    }
  }
}
