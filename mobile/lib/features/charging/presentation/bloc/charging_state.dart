part of 'charging_bloc.dart';

abstract class ChargingState extends Equatable {
  const ChargingState();
  @override
  List<Object> get props => [];
}

class ChargingInitial extends ChargingState {}

class ChargingConnecting extends ChargingState {}

class ChargingActive extends ChargingState {
  final ChargingSession session;
  const ChargingActive(this.session);

  @override
  List<Object> get props => [session];
}

class ChargingCompleted extends ChargingState {
  final ChargingSession finalSession;
  const ChargingCompleted(this.finalSession);
}

class ChargingError extends ChargingState {
  final String message;
  const ChargingError(this.message);
}
