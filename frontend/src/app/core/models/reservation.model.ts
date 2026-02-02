export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

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
  connectorType?: string;
  createdAt: Date;
}

export interface Charger {
  id: string;
  chargerId?: string; // Physical charger ID
  type: string;
  connectorType?: string;
  powerOutput: number;
  hourlyRate: number;
  status?: 'Available' | 'In Use' | 'Offline' | 'Maintenance';
}

export interface Station {
  id: string;
  name: string;
  location: string;
  address?: string;
  city?: string;
  chargers: Charger[];
  latitude?: number;
  longitude?: number;
  status?: string;
  operatorId?: string;
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

/**
 * Slot update event from WebSocket
 */
export interface SlotUpdateEvent {
  chargerId: string;
  stationId: string;
  reservedFrom: Date;
  reservedTo: Date;
  action: 'created' | 'cancelled' | 'expired';
}

