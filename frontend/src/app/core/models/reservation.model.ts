import { ChargerType } from './station.model';

// Reservation status enumeration
export enum ReservationStatus {
  CONFIRMED = 'CONFIRMED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

// Target SoC enumeration
export enum TargetSoC {
  FIFTY_PERCENT = 50,
  EIGHTY_PERCENT = 80,
  HUNDRED_PERCENT = 100,
}

// Reservation model
export interface Reservation {
  id: string;
  userId: string;
  stationId: string;
  chargerType: ChargerType;
  reservationDate: Date;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  targetSoC: TargetSoC;
  status: ReservationStatus;
  estimatedCost: number;
  actualCost?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Reservation with station details
export interface ReservationDetail extends Reservation {
  stationName?: string;
  stationLocation?: string;
  userEmail?: string;
  userName?: string;
}

// Reservation creation DTO
export interface CreateReservationDto {
  stationId: string;
  chargerType: ChargerType;
  reservationDate: Date;
  startTime: string;
  endTime: string;
  targetSoC: TargetSoC;
}
