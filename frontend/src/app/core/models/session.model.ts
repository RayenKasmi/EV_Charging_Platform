import { ChargerType } from './station.model';

// Session status enumeration
export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
}

// Charging session model
export interface ChargingSession {
  id: string;
  userId: string;
  stationId: string;
  chargerId: string;
  chargerType: ChargerType;
  startTime: Date;
  endTime?: Date;
  energyDelivered: number; // kWh
  totalCost: number;
  status: SessionStatus;
  currentSoC: number; // 0-100
  targetSoC: number; // 0-100
  averagePowerOutput?: number; // kW
  estimatedTimeRemaining?: number; // seconds
  createdAt: Date;
}

// Session update (for real-time updates)
export interface SessionUpdate {
  sessionId: string;
  currentSoC: number;
  energyDelivered: number;
  totalCost: number;
  currentPowerOutput: number; // kW
  estimatedTimeRemaining: number; // seconds
  timestamp: Date;
}

// Session monitor data (for display)
export interface SessionMonitor {
  session: ChargingSession;
  currentSoC: number;
  currentPowerOutput: number; // kW
  energyDelivered: number;
  sessionDuration: string; // formatted MM:ss
  currentCost: number;
  estimatedTimeRemaining: string; // formatted HH:mm:ss
  powerHistory: Array<{ timestamp: Date; power: number }>;
}

// Start session DTO
export interface StartSessionDto {
  stationId: string;
  chargerId: string;
  targetSoC: number;
}
