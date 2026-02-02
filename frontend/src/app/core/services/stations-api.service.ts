import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';

/**
 * API Response interfaces matching backend DTOs
 */
export interface ApiCharger {
  id: string;
  chargerId: string;
  stationId: string;
  type: 'LEVEL_2' | 'DC_FAST';
  status: 'AVAILABLE' | 'OCCUPIED' | 'OFFLINE' | 'MAINTENANCE';
  connectorType: 'CCS' | 'CHADEMO' | 'TYPE_2' | 'J1772';
  powerKW: number;
  currentRate: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiOperator {
  id: string;
  email: string;
  fullName: string;
}

export interface ApiStation {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'OFFLINE';
  operatorId: string;
  isActive: boolean;
  chargers: ApiCharger[];
  operator: ApiOperator;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  distance?: number; // Present when querying nearby stations
}

export interface StationsResponse {
  data: ApiStation[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface StationAvailabilityResponse {
  stationId: string;
  total: number;
  available: number;
  occupied: number;
  offline: number;
  maintenance: ApiCharger[];
}

export interface StationQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  operatorId?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  chargerType?: string;
  city?: string;
}

/**
 * StationsApiService
 * 
 * Handles all HTTP communication with the stations backend API.
 * Uses Angular's HttpClient with RxJS observables for reactive data fetching.
 * 
 * ## Why RxJS Observables for HTTP?
 * 1. **Lazy execution**: HTTP request only fires when subscribed
 * 2. **Cancellation**: Unsubscribing cancels the pending request
 * 3. **Operators**: Can use map, catchError, retry, etc.
 * 4. **Integration**: Works seamlessly with async pipe in templates
 */
@Injectable({
  providedIn: 'root'
})
export class StationsApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/stations`;

  /**
   * Get all stations with optional filtering and pagination
   */
  getStations(params?: StationQueryParams): Observable<StationsResponse> {
    let httpParams = new HttpParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<StationsResponse>(this.apiUrl, { params: httpParams });
  }

  /**
   * Get a single station by ID with all chargers
   */
  getStation(id: string): Observable<ApiStation> {
    return this.http.get<ApiStation>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get station availability (charger status counts)
   */
  getStationAvailability(id: string): Observable<StationAvailabilityResponse> {
    return this.http.get<StationAvailabilityResponse>(`${this.apiUrl}/${id}/availability`);
  }

  /**
   * Get chargers for a specific station
   */
  getStationChargers(stationId: string): Observable<ApiCharger[]> {
    return this.http.get<ApiCharger[]>(`${this.apiUrl}/${stationId}/chargers`);
  }

  /**
   * Get nearby stations based on coordinates
   */
  getNearbyStations(
    latitude: number,
    longitude: number,
    radiusMeters: number = 10000
  ): Observable<StationsResponse> {
    return this.getStations({
      latitude,
      longitude,
      radius: radiusMeters,
    });
  }

  /**
   * Map charger type from backend enum to display string
   */
  mapChargerType(type: string): string {
    const typeMap: Record<string, string> = {
      'LEVEL_2': 'Level 2',
      'DC_FAST': 'DC Fast',
    };
    return typeMap[type] || type;
  }

  /**
   * Map connector type from backend enum to display string
   */
  mapConnectorType(type: string): string {
    const connectorMap: Record<string, string> = {
      'CCS': 'CCS',
      'CHADEMO': 'CHAdeMO',
      'TYPE_2': 'Type 2',
      'J1772': 'J1772',
    };
    return connectorMap[type] || type;
  }

  /**
   * Map charger status to display-friendly format
   */
  mapChargerStatus(status: string): 'Available' | 'In Use' | 'Offline' | 'Maintenance' {
    const statusMap: Record<string, 'Available' | 'In Use' | 'Offline' | 'Maintenance'> = {
      'AVAILABLE': 'Available',
      'OCCUPIED': 'In Use',
      'OFFLINE': 'Offline',
      'MAINTENANCE': 'Maintenance',
    };
    return statusMap[status] || 'Offline';
  }
}
