import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';

/**
 * API Reservation interface matching backend response
 */
export interface ApiReservation {
  id: string;
  userId: string;
  chargerId: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
  reservedFrom: string;
  reservedTo: string;
  createdAt: string;
  updatedAt: string;
  charger: {
    id: string;
    chargerId: string;
    type: string;
    connectorType: string;
    powerKW: number;
    currentRate: number | null;
    station: {
      id: string;
      name: string;
      address: string;
      city: string;
    };
  };
}

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

export interface CreateReservationRequest {
  chargerId: string;
  reservedFrom: string; // ISO date string
  reservedTo: string;   // ISO date string
}

/**
 * BookingsApiService
 * 
 * Handles all HTTP communication with the bookings/reservations backend API.
 * Provides methods for fetching, creating, and cancelling reservations.
 * 
 * ## Design Decisions:
 * 1. **Separation of concerns**: API calls are separate from UI state management
 * 2. **Type safety**: Strong typing for all API responses and requests
 * 3. **Date handling**: API uses ISO strings, we convert to Date objects in service layer
 */
@Injectable({
  providedIn: 'root'
})
export class BookingsApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/bookings`;

  /**
   * Get available slots for a charger on a specific date
   * This is the primary endpoint for showing availability calendar
   * 
   * @param chargerId - The charger UUID
   * @param date - Optional date in YYYY-MM-DD format, defaults to today
   */
  getChargerSlots(chargerId: string, date?: string): Observable<ChargerSlotsResponse> {
    const url = `${this.apiUrl}/chargers/${chargerId}/slots`;
    if (date) {
      return this.http.get<ChargerSlotsResponse>(url, { params: { date } });
    }
    return this.http.get<ChargerSlotsResponse>(url);
  }

  /**
   * Get all reservations for the current authenticated user
   */
  getUserReservations(): Observable<ApiReservation[]> {
    return this.http.get<ApiReservation[]>(`${this.apiUrl}/reservations`);
  }

  /**
   * Get a specific reservation by ID
   */
  getReservation(id: string): Observable<ApiReservation> {
    return this.http.get<ApiReservation>(`${this.apiUrl}/reservations/${id}`);
  }

  /**
   * Create a new reservation
   * 
   * @param data - Reservation details with charger ID and time range
   */
  createReservation(data: CreateReservationRequest): Observable<ApiReservation> {
    return this.http.post<ApiReservation>(`${this.apiUrl}/reservations`, data);
  }

  /**
   * Cancel an existing reservation
   * 
   * @param id - The reservation UUID to cancel
   */
  cancelReservation(id: string): Observable<ApiReservation> {
    return this.http.delete<ApiReservation>(`${this.apiUrl}/reservations/${id}`);
  }

  /**
   * Map API reservation status to display-friendly format
   */
  mapReservationStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'PENDING': 'Pending',
      'CONFIRMED': 'Confirmed',
      'CANCELLED': 'Cancelled',
      'EXPIRED': 'Expired',
    };
    return statusMap[status] || status;
  }
}
