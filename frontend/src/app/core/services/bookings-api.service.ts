import { Injectable, inject, Signal } from '@angular/core';
import { HttpClient, httpResource, HttpResourceRef } from '@angular/common/http';
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
 * Uses httpResource for read operations and Observables for write operations.
 * 
 * ## Design Decisions:
 * 1. **httpResource for reads**: Declarative data fetching with automatic caching
 * 2. **Observables for writes**: Create and cancel operations use traditional HTTP calls
 * 3. **Type safety**: Strong typing for all API responses and requests
 * 4. **Date handling**: API uses ISO strings, consumers handle Date conversion
 */
@Injectable({
  providedIn: 'root'
})
export class BookingsApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/bookings`;

  // =====================================================
  // HTTP RESOURCE METHODS (Signal-based reads)
  // =====================================================

  /**
   * Get available slots for a charger on a specific date
   * Returns an httpResource that refetches when chargerId or date changes
   * 
   * @param chargerId - Signal containing the charger UUID
   * @param date - Signal containing optional date in YYYY-MM-DD format
   */
  chargerSlotsResource(
    chargerId: Signal<string | null>,
    date: Signal<string | undefined>
  ): HttpResourceRef<ChargerSlotsResponse | undefined> {
    return httpResource(() => {
      const id = chargerId();
      const dateParam = date();
      
      if (!id) return undefined;
      
      const url = `${this.apiUrl}/chargers/${id}/slots`;
      if (dateParam) {
        return { url, params: { date: dateParam } };
      }
      return { url };
    });
  }

  /**
   * Get all reservations for the current authenticated user
   * Uses httpResource for declarative fetching
   */
  userReservationsResource(): HttpResourceRef<ApiReservation[]> {
    return httpResource(
      () => `${this.apiUrl}/reservations`,
      { defaultValue: [] }
    );
  }

  /**
   * Get a specific reservation by ID
   * 
   * @param reservationId - Signal containing the reservation UUID
   */
  reservationResource(
    reservationId: Signal<string | null>
  ): HttpResourceRef<ApiReservation | undefined> {
    return httpResource(() => {
      const id = reservationId();
      return id ? `${this.apiUrl}/reservations/${id}` : undefined;
    });
  }

  // =====================================================
  // CRUD OPERATIONS (Write operations use Observables)
  // =====================================================

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

  // =====================================================
  // UTILITY MAPPERS
  // =====================================================

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
