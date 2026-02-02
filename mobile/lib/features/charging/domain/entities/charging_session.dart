class ChargingSession {
  final String sessionId;
  final String stationName;
  final double currentPowerKw;
  final double energyDeliveredKwh;
  final double currentCost;
  final int soc; // State of Charge %
  final int timeElapsedSeconds;
  final bool isCharging;

  const ChargingSession({
    required this.sessionId,
    required this.stationName,
    required this.currentPowerKw,
    required this.energyDeliveredKwh,
    required this.currentCost,
    required this.soc,
    required this.timeElapsedSeconds,
    required this.isCharging,
  });

  ChargingSession copyWith({
    String? sessionId,
    String? stationName,
    double? currentPowerKw,
    double? energyDeliveredKwh,
    double? currentCost,
    int? soc,
    int? timeElapsedSeconds,
    bool? isCharging,
  }) {
    return ChargingSession(
      sessionId: sessionId ?? this.sessionId,
      stationName: stationName ?? this.stationName,
      currentPowerKw: currentPowerKw ?? this.currentPowerKw,
      energyDeliveredKwh: energyDeliveredKwh ?? this.energyDeliveredKwh,
      currentCost: currentCost ?? this.currentCost,
      soc: soc ?? this.soc,
      timeElapsedSeconds: timeElapsedSeconds ?? this.timeElapsedSeconds,
      isCharging: isCharging ?? this.isCharging,
    );
  }
}
