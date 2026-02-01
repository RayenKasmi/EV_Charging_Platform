export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Reservation {
  id: string;
  userId: string;
  stationId: string;
  chargerId: string;
  startTime: Date;
  endTime: Date;
  status: ReservationStatus;
  estimatedCost: number;
  stationName?: string;
  chargerType?: string;
  createdAt: Date;
}

export interface Charger {
  id: string;
  type: string;
  powerOutput: number;
  hourlyRate: number;
  status?: 'Available' | 'In Use' | 'Offline';
}

export interface Station {
  id: string;
  name: string;
  location: string;
  chargers: Charger[];
  latitude?: number;
  longitude?: number;
}

export interface CreateReservationData {
  stationId: string;
  chargerId: string;
  startTime: Date;
  endTime: Date;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface TimeSlot {
  time: Date;
  status: 'available' | 'my-reservation' | 'reserved' | 'past';
  reservationId?: string;
}
