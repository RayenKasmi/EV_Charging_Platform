/**
 * Reservation domain models
 * 
 * This file contains models specific to the reservation/booking domain.
 */

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

/**
 * Reservation entity - domain model for client-side use
 */
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

