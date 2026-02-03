part of 'charging_bloc.dart';

abstract class ChargingEvent extends Equatable {
  const ChargingEvent();

  @override
  List<Object> get props => [];
}

class StartChargingSession extends ChargingEvent {
  final String chargerId;
  final int targetSoc;

  const StartChargingSession({required this.chargerId, this.targetSoc = 80});
}

class StopChargingSession extends ChargingEvent {}

class UpdateSessionMetrics extends ChargingEvent {
  final ChargingSession session;
  const UpdateSessionMetrics(this.session);
}
