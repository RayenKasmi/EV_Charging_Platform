import 'dart:async';
import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';
import '../../domain/entities/charging_session.dart';
import '../../../../core/network/socket_service.dart';

part 'charging_event.dart';
part 'charging_state.dart';

@injectable
class ChargingBloc extends Bloc<ChargingEvent, ChargingState> {
  final SocketService _socketService;
  Timer? _simulationTimer;

  ChargingBloc(this._socketService) : super(ChargingInitial()) {
    on<StartChargingSession>(_onStartCharging);
    on<UpdateSessionMetrics>(_onUpdateMetrics);
    on<StopChargingSession>(_onStopCharging);
  }

  void _onStartCharging(StartChargingSession event, Emitter<ChargingState> emit) {
    emit(ChargingConnecting());
    
    // Simulate API call to start session...
    // In real app: await repository.startSession(event.chargerId);
    
    // Setup Socket Listener
    _socketService.on('session-update', (data) {
      // In real app, parse data to ChargingSession
      // add(UpdateSessionMetrics(ParsedSession));
    });

    // For User Story Demo: Start Local Simulation since backend might not be running
    _startSimulation();
  }

  void _onUpdateMetrics(UpdateSessionMetrics event, Emitter<ChargingState> emit) {
    emit(ChargingActive(event.session));
  }

  void _onStopCharging(StopChargingSession event, Emitter<ChargingState> emit) {
    _simulationTimer?.cancel();
    _socketService.off('session-update');
    
    if (state is ChargingActive) {
      emit(ChargingCompleted((state as ChargingActive).session));
    } else {
      emit(ChargingInitial());
    }
  }

  void _startSimulation() {
    var validSession = ChargingSession(
      sessionId: '123',
      stationName: 'EcoCharge Downtown',
      currentPowerKw: 0,
      energyDeliveredKwh: 0,
      currentCost: 0,
      soc: 20,
      timeElapsedSeconds: 0,
      isCharging: true,
    );

    _simulationTimer = Timer.periodic(const Duration(milliseconds: 1820), (timer) {
      if (validSession.soc >= 100) {
        add(StopChargingSession());
        return;
      }

      validSession = validSession.copyWith(
        currentPowerKw: 22.0 + (timer.tick % 2), // Fluctuate around 22kW
        energyDeliveredKwh: validSession.energyDeliveredKwh + 0.1,
        currentCost: validSession.currentCost + 0.05,
        soc: validSession.soc + 1,
        timeElapsedSeconds: validSession.timeElapsedSeconds + 1,
      );
      
      add(UpdateSessionMetrics(validSession));
    });
  }

  @override
  Future<void> close() {
    _simulationTimer?.cancel();
    return super.close();
  }
}
