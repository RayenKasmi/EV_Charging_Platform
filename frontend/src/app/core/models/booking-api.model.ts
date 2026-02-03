import { ChargerType, ConnectorType } from './stations.model';

/**
 * Booking API DTOs
 * 
 * This file contains all request and response interfaces used by the bookings API.
 */

/**
 * Reservation status types matching backend enum
 */
export type ApiReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED' | 'ACTIVE' | 'COMPLETED';

/**
 * Nested charger data in API reservation response
 */
export interface ApiReservationCharger {
  id: string;
  chargerId: string;
  type: ChargerType;
  connectorType: ConnectorType;
  powerKW: number;
  currentRate: number | null;
  station: {
    id: string;
    name: string;
    address: string;
    city: string;
  };
}

/**
 * API Reservation response from backend
 * Includes nested charger and station data
 */
export interface ApiReservation {
  id: string;
  userId: string;
  chargerId: string;
  status: ApiReservationStatus;
  reservedFrom: string; // ISO date string
  reservedTo: string;   // ISO date string
  createdAt: string;
  updatedAt: string;
  charger: ApiReservationCharger;
}

/**
 * Charger slots response for availability check
 */
export interface ChargerSlotsResponse {
  chargerId: string;
  stationId: string;
  chargerStatus: string;
  date: string;
  reservations: {
    id: string;
    userId: string;
    reservedFrom: string;
    reservedTo: string;
    status: string;
  }[];
}

/**
 * Request payload for creating a new reservation
 */
export interface CreateReservationRequest {
  chargerId: string;
  reservedFrom: string; // ISO date string
  reservedTo: string;   // ISO date string
}

/**
 * Request payload for canceling a reservation
 * Currently only uses ID in URL path, but defined for future extensibility
 */
export interface CancelReservationRequest {
  id: string;
}
