import { Injectable, inject, signal, computed, OnDestroy, effect } from '@angular/core';
import { Observable, of, throwError, Subject } from 'rxjs';
import { map, tap, catchError, takeUntil } from 'rxjs/operators';
import {
  Reservation,
  CreateReservationData,
  Station,
  Charger,
  TimeRange,
  ReservationStatus,
} from '../models/reservation.model';
import { StationsService} from './stations.service';
import { BookingsApiService, ApiReservation, ChargerSlotsResponse } from './bookings-api.service';
import { WebSocketService, SlotUpdate } from './websocket.service';
import { StationQuery, Station as ApiStation, Charger as ApiCharger } from '@core/models/stations.model';

/**
 * ReservationService
 * 
 * This service orchestrates the reservation feature by combining:
 * 1. **HTTP API calls** for CRUD operations (via BookingsApiService and StationsApiService)
 * 2. **WebSocket updates** for real-time synchronization (via WebSocketService)
 * 3. **Angular Signals** for reactive state management
 * 
 * ## Architecture Overview
 * 
 * ```
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    ReservationService                        │
 * │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
 * │  │ HTTP APIs   │  │ WebSocket   │  │ Angular Signals     │  │
 * │  │ (RxJS)      │  │ (Socket.io) │  │ (Reactive State)    │  │
 * │  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
 * │         │                │                     │             │
 * │         └────────────────┼─────────────────────┘             │
 * │                          ▼                                   │
 * │              Unified Reactive Data Flow                      │
 * └─────────────────────────────────────────────────────────────┘
 * ```
 * 
 * ## Why This Design?
 * 
 * ### RxJS for HTTP:
 * - **Lazy execution**: Requests only fire when subscribed
 * - **Cancellation**: Auto-cancels requests when component destroys
 * - **Operators**: map, catchError, retry for robust error handling
 * 
 * ### Signals for State:
 * - **Synchronous reads**: No subscription needed for current value
 * - **Fine-grained reactivity**: Only affected components re-render
 * - **Computed signals**: Derived state auto-updates
 * 
 * ### WebSocket for Real-time:
 * - **Push updates**: Server pushes changes, no polling needed
 * - **Room-based**: Subscribe only to relevant chargers/stations
 * - **Automatic reconnection**: Built into Socket.io
 */
@Injectable({
  providedIn: 'root'
})
export class ReservationService implements OnDestroy {
  private stationsService = inject(StationsService);
  private bookingsApi = inject(BookingsApiService);
  private wsService = inject(WebSocketService);

  private destroy$ = new Subject<void>();

  // =====================================================
  // STATE MANAGEMENT USING SIGNALS
  // =====================================================

  /**
   * Local cache of user reservations
   * Signal provides synchronous access and automatic change detection
   */
  private _reservations = signal<Reservation[]>([]);
  public readonly reservations = this._reservations.asReadonly();

  /**
   * Query signal for stations resource - triggers refetch when changed
   */
  private stationsQuery = signal<StationQuery>({ page: 1, limit: 100 });

  /**
   * Stations resource using httpResource - declarative data fetching
   */
  private stationsResource = this.stationsService.stationsResource(this.stationsQuery);

  /**
   * Stations mapped to frontend model - computed from resource
   */
  public readonly stations = computed(() => {
    const response = this.stationsResource.value();
    if (!response?.data) return [];
    return this.mapApiStationsToModel(response.data as unknown as ApiStation[]);
  });

  /**
   * Loading states - derived from resource
   */
  private _isLoadingReservations = signal(false);
  public readonly isLoadingReservations = this._isLoadingReservations.asReadonly();
  public readonly isLoadingStations = computed(() => this.stationsResource.isLoading());

  /**
   * Currently subscribed charger for WebSocket updates
   */
  private _subscribedChargerId = signal<string | null>(null);

  // =====================================================
  // COMPUTED SIGNALS (Derived State)
  // =====================================================

  /**
   * Filter reservations by status - computed signals auto-update
   */
  public readonly upcomingReservations = computed(() =>
    this._reservations().filter(r => 
      r.status === 'PENDING' || r.status === 'CONFIRMED'
    ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  );

  public readonly pastReservations = computed(() =>
    this._reservations().filter(r => 
      r.status === 'COMPLETED' || r.status === 'EXPIRED'
    ).sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
  );

  public readonly cancelledReservations = computed(() =>
    this._reservations().filter(r => r.status === 'CANCELLED')
  );

  constructor() {
    this.setupWebSocketListeners();
  }

  // =====================================================
  // WEBSOCKET REAL-TIME UPDATES
  // =====================================================

  /**
   * Setup WebSocket event listeners
   * Subscribes to slot updates and updates local state accordingly
   */
  private setupWebSocketListeners(): void {
    // Listen for slot updates (reservation created/cancelled)
    this.wsService.slotsUpdate$
      .pipe(takeUntil(this.destroy$))
      .subscribe((update: SlotUpdate) => {
        console.log('[ReservationService] Received slot update:', update);
        
        // Refresh reservations when a slot update is received
        // This ensures we have the latest data from the server
        if (this._subscribedChargerId() === update.chargerId) {
          this.refreshReservationsForCharger(update.chargerId);
        }
      });

    // Listen for charger status updates
    this.wsService.chargerStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe((update) => {
        console.log('[ReservationService] Charger status changed:', update);
        // Update local station state if needed
        this.updateChargerStatusInCache(update.chargerId, update.status);
      });
  }

  /**
   * Subscribe to real-time updates for a specific charger
   * Call this when user views a charger's calendar
   */
  subscribeToCharger(chargerId: string): void {
    // Unsubscribe from previous charger if any
    const previousChargerId = this._subscribedChargerId();
    if (previousChargerId && previousChargerId !== chargerId) {
      this.wsService.unsubscribeFromCharger(previousChargerId);
    }

    this._subscribedChargerId.set(chargerId);
    this.wsService.subscribeToCharger(chargerId);
  }

  /**
   * Unsubscribe from charger updates
   * Call this when user navigates away from charger view
   */
  unsubscribeFromCharger(chargerId: string): void {
    this.wsService.unsubscribeFromCharger(chargerId);
    if (this._subscribedChargerId() === chargerId) {
      this._subscribedChargerId.set(null);
    }
  }

  /**
   * Subscribe to real-time updates for a station
   */
  subscribeToStation(stationId: string): void {
    this.wsService.subscribeToStation(stationId);
  }

  /**
   * Unsubscribe from station updates
   */
  unsubscribeFromStation(stationId: string): void {
    this.wsService.unsubscribeFromStation(stationId);
  }

  /**
   * Get observable for slot updates for a specific charger
   * Components can subscribe to receive real-time updates
   */
  getSlotsUpdatesForCharger(chargerId: string): Observable<SlotUpdate> {
    return this.wsService.getSlotsUpdatesForCharger(chargerId);
  }

  // =====================================================
  // RESERVATIONS API
  // =====================================================

  /**
   * Get user's reservations from API
   * Uses RxJS Observable for the HTTP request
   * Updates Signal state on success
   */
  getReservations(userId?: string): Observable<Reservation[]> {
    this._isLoadingReservations.set(true);

    return this.bookingsApi.getUserReservations().pipe(
      map(apiReservations => this.mapApiReservationsToModel(apiReservations)),
      tap(reservations => {
        this._reservations.set(reservations);
        this._isLoadingReservations.set(false);
      }),
      catchError(error => {
        this._isLoadingReservations.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new reservation
   * After success, emits WebSocket event (handled by backend)
   * and updates local state
   */
  createReservation(data: CreateReservationData): Observable<Reservation> {
    const request = {
      chargerId: data.chargerId,
      reservedFrom: data.startTime.toISOString(),
      reservedTo: data.endTime.toISOString(),
    };

    return this.bookingsApi.createReservation(request).pipe(
      map(apiReservation => this.mapSingleApiReservation(apiReservation)),
      tap(reservation => {
        // Add to local state immediately for optimistic UI
        this._reservations.update(reservations => [...reservations, reservation]);
      }),
      catchError(error => {
        console.error('[ReservationService] Failed to create reservation:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cancel a reservation
   */
  cancelReservation(id: string): Observable<boolean> {
    return this.bookingsApi.cancelReservation(id).pipe(
      map(() => true),
      tap(() => {
        // Update local state
        this._reservations.update(reservations =>
          reservations.map(r => 
            r.id === id ? { ...r, status: 'CANCELLED' as ReservationStatus } : r
          )
        );
      }),
      catchError(error => {
        console.error('[ReservationService] Failed to cancel reservation:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get charger slots for a specific date
   * Returns the availability calendar data
   */
  getChargerSlots(chargerId: string, date?: string): Observable<ChargerSlotsResponse> {
    return this.bookingsApi.getChargerSlots(chargerId, date);
  }

  /**
   * Get reservations for a station on a specific date
   * Used for calendar view - filters local cache or fetches from API
   */
  getReservationsByStationAndDate(stationId: string, date: Date): Observable<Reservation[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Filter from local cache first
    const filtered = this._reservations().filter(r =>
      r.stationId === stationId &&
      r.status !== 'CANCELLED' &&
      (
        (r.startTime >= startOfDay && r.startTime <= endOfDay) ||
        (r.endTime >= startOfDay && r.endTime <= endOfDay) ||
        (r.startTime < startOfDay && r.endTime > endOfDay)
      )
    );

    return of(filtered);
  }

  // =====================================================
  // STATIONS API (using httpResource)
  // =====================================================

  /**
   * Refresh stations data - triggers resource refetch
   */
  refreshStations(): void {
    this.stationsResource.reload();
  }

  /**
   * Get a single station by ID from cache
   */
  getStationById(id: string): Station | undefined {
    return this.stations().find(s => s.id === id);
  }

  /**
   * Check charger availability for a time range
   */
  checkAvailability(stationId: string, timeRange: TimeRange): Charger[] {
    const station = this.getStationById(stationId);
    if (!station) return [];

    // Get conflicting reservations
    const conflictingReservations = this._reservations().filter(r =>
      r.stationId === stationId &&
      r.status !== 'CANCELLED' &&
      r.status !== 'COMPLETED' &&
      this.timeRangesOverlap(
        { start: r.startTime, end: r.endTime },
        timeRange
      )
    );

    const unavailableChargerIds = new Set(conflictingReservations.map(r => r.chargerId));
    return station.chargers.filter(c => !unavailableChargerIds.has(c.id));
  }

  /**
   * Validate if there's a time conflict for a reservation
   */
  validateConflict(
    stationId: string,
    startTime: Date,
    endTime: Date,
    excludeReservationId?: string
  ): Observable<boolean> {
    const conflictingReservations = this._reservations().filter(r =>
      r.stationId === stationId &&
      r.status !== 'CANCELLED' &&
      r.status !== 'COMPLETED' &&
      r.id !== excludeReservationId &&
      this.timeRangesOverlap(
        { start: r.startTime, end: r.endTime },
        { start: startTime, end: endTime }
      )
    );

    return of(conflictingReservations.length > 0);
  }

  /**
   * Calculate estimated cost for a reservation
   */
  calculateEstimatedCost(
    chargerId: string,
    stationId: string,
    startTime: Date,
    endTime: Date
  ): number {
    const station = this.getStationById(stationId);
    const charger = station?.chargers.find(c => c.id === chargerId);

    if (!charger) return 0;

    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    return Math.round(durationHours * charger.hourlyRate * 100) / 100;
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  /**
   * Map API reservation response to frontend model
   */
  private mapApiReservationsToModel(apiReservations: ApiReservation[]): Reservation[] {
    return apiReservations.map(r => this.mapSingleApiReservation(r));
  }

  private mapSingleApiReservation(r: ApiReservation): Reservation {
    const chargerType = r.charger?.type 
      ? this.stationsService.mapChargerType(r.charger.type) 
      : undefined;

    // Calculate hourly rate from power and a base rate
    const hourlyRate = r.charger?.currentRate || (r.charger?.powerKW * 0.35) || 0;
    const durationHours = (new Date(r.reservedTo).getTime() - new Date(r.reservedFrom).getTime()) / (1000 * 60 * 60);
    const estimatedCost = Math.round(durationHours * hourlyRate * 100) / 100;

    return {
      id: r.id,
      userId: r.userId,
      stationId: r.charger?.station?.id || '',
      chargerId: r.chargerId,
      startTime: new Date(r.reservedFrom),
      endTime: new Date(r.reservedTo),
      status: this.mapApiStatus(r.status),
      estimatedCost,
      stationName: r.charger?.station?.name,
      chargerType,
      connectorType: r.charger?.connectorType 
        ? this.stationsService.mapConnectorType(r.charger.connectorType)
        : undefined,
      createdAt: new Date(r.createdAt),
    };
  }

  private mapApiStatus(status: string): ReservationStatus {
    const statusMap: Record<string, ReservationStatus> = {
      'PENDING': 'PENDING',
      'CONFIRMED': 'CONFIRMED',
      'CANCELLED': 'CANCELLED',
      'EXPIRED': 'EXPIRED',
    };
    return statusMap[status] || 'PENDING';
  }

  /**
   * Map API station response to frontend model
   */
  private mapApiStationsToModel(apiStations: ApiStation[]): Station[] {
    return apiStations.map(s => this.mapSingleApiStation(s));
  }

  private mapSingleApiStation(s: ApiStation): Station {
    return {
      id: s.id,
      name: s.name,
      location: s.address,
      address: s.address,
      city: s.city,
      latitude: s.latitude,
      longitude: s.longitude,
      status: s.status,
      operatorId: s.operatorId,
      chargers: s.chargers.map(c => this.mapApiCharger(c)),
    };
  }

  private mapApiCharger(c: ApiCharger): Charger {
    return {
      id: c.id,
      chargerId: c.chargerId,
      type: this.stationsService.mapChargerType(c.type),
      connectorType: this.stationsService.mapConnectorType(c.connectorType),
      powerOutput: c.powerKW,
      hourlyRate: c.currentRate || c.powerKW * 0.35, // Default rate based on power
      status: this.stationsService.mapChargerStatus(c.status),
    };
  }

  /**
   * Update charger status - triggers resource reload for fresh data
   * With httpResource, we don't maintain local cache - we refetch
   */
  private updateChargerStatusInCache(chargerId: string, status: string): void {
    // Trigger a reload to get fresh data from server
    this.stationsResource.reload();
  }

  /**
   * Refresh reservations for a specific charger
   * Called when WebSocket update is received
   */
  private refreshReservationsForCharger(chargerId: string): void {
    // Fetch latest reservations from server
    this.getReservations().subscribe();
  }

  private timeRangesOverlap(range1: TimeRange, range2: TimeRange): boolean {
    return range1.start < range2.end && range2.start < range1.end;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Cleanup WebSocket subscriptions
    const subscribedCharger = this._subscribedChargerId();
    if (subscribedCharger) {
      this.wsService.unsubscribeFromCharger(subscribedCharger);
    }
  }
}
