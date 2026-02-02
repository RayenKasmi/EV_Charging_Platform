import { Injectable, Signal, inject } from '@angular/core';
import { HttpClient, httpResource, HttpResourceRef } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  Station,
  StationAvailability,
  StationListResponse,
  StationQuery,
  CreateStationPayload,
  UpdateStationPayload,
  Charger,
  CreateChargerPayload,
  UpdateChargerPayload,
} from '@core/models/stations.model';

@Injectable({
  providedIn: 'root',
})
export class StationsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/stations`;

  // =====================================================
  // HTTP RESOURCE METHODS (Signal-based)
  // =====================================================

  stationsResource(query: Signal<StationQuery>): HttpResourceRef<StationListResponse> {
    return httpResource(
      () => ({
        url: this.apiUrl,
        params: this.buildParamRecord(query()),
      }),
      {
        defaultValue: {
          data: [],
          meta: {
            page: query().page ?? 1,
            limit: query().limit ?? 10,
            total: 0,
            totalPages: 1,
          },
        },
      }
    );
  }

  stationResource(stationId: Signal<string | null>): HttpResourceRef<Station | undefined> {
    return httpResource(() => {
      const id = stationId();
      return id ? `${this.apiUrl}/${id}` : undefined;
    });
  }

  availabilityResource(
    stationId: Signal<string | null>
  ): HttpResourceRef<StationAvailability> {
    return httpResource(
      () => {
        const id = stationId();
        return id ? `${this.apiUrl}/${id}/availability` : undefined;
      },
      {
        defaultValue: {
          stationId: '',
          total: 0,
          available: 0,
          occupied: 0,
          offline: 0,
          maintenance: 0,
        },
      }
    );
  }

  chargersResource(stationId: Signal<string | null>): HttpResourceRef<Charger[]> {
    return httpResource(
      () => {
        const id = stationId();
        return id ? `${this.apiUrl}/${id}/chargers` : undefined;
      },
      { defaultValue: [] }
    );
  }

  // =====================================================
  // CRUD OPERATIONS (Write operations need Observables)
  // =====================================================

  createStation(payload: CreateStationPayload): Observable<Station> {
    return this.http.post<Station>(this.apiUrl, payload);
  }

  updateStation(id: string, payload: UpdateStationPayload): Observable<Station> {
    return this.http.patch<Station>(`${this.apiUrl}/${id}`, payload);
  }

  deleteStation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  addCharger(stationId: string, payload: CreateChargerPayload): Observable<Charger> {
    return this.http.post<Charger>(`${this.apiUrl}/${stationId}/chargers`, payload);
  }

  updateCharger(
    stationId: string,
    chargerId: string,
    payload: UpdateChargerPayload,
  ): Observable<Charger> {
    return this.http.patch<Charger>(`${this.apiUrl}/${stationId}/chargers/${chargerId}`, payload);
  }

  deleteCharger(stationId: string, chargerId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${stationId}/chargers/${chargerId}`);
  }

  checkChargerIdAvailability(chargerId: string): Observable<{ available: boolean }> {
    return this.http.get<{ available: boolean }>(`${this.apiUrl}/chargers/check`, {
      params: { chargerId },
    });
  }

  // =====================================================
  // UTILITY MAPPERS
  // =====================================================

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

  private buildParamRecord(
    query: StationQuery
  ): Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>> {
    return Object.entries(query).reduce((acc, [key, value]) => {
      if (value === undefined || value === null || value === '') {
        return acc;
      }
      acc[key] = value as string | number | boolean;
      return acc;
    }, {} as Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>);
  }
}
