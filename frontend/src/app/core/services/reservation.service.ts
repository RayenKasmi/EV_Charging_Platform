import { Injectable, inject, signal, computed, OnDestroy, effect } from '@angular/core';
import { Observable, of, throwError, Subject } from 'rxjs';
import { map, tap, catchError, takeUntil, auditTime, filter } from 'rxjs/operators';
import {
  Reservation,
  CreateReservationData,
  TimeRange,
  ReservationStatus,
} from '@core/models/reservation.model';
import { ApiReservation, ChargerSlotsResponse } from '../models/booking-api.model';
import { StationsService} from './stations.service';
import { BookingsApiService } from './bookings-api.service';
import { WebSocketService } from './websocket.service';
import { StationQuery, Station, Charger, SlotUpdate } from '@core/models/stations.model';

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
   * Query signal for stations resource - triggers refetch when changed
   */
  private stationsQuery = signal<StationQuery>({ page: 1, limit: 100 });

  /**
   * Stations resource using httpResource - declarative data fetching
   */
  private stationsResource = this.stationsService.stationsResource(this.stationsQuery);

  /**
   * Stations from API - computed from resource
   */
  public readonly stations = computed(() => {
    const response = this.stationsResource.value();
    if (!response?.data) return [];
    return response.data as Station[];
  });

  /**
   * Loading states - derived from resource
   */
  public readonly isLoadingStations = computed(() => this.stationsResource.isLoading());

  /**
   * User reservations resource using httpResource
   */
  private userReservationsResource = this.bookingsApi.userReservationsResource();

  /**
   * User reservations mapped to frontend model - computed from resource
   */
  public readonly reservations = computed(() => {
    const apiReservations = this.userReservationsResource.value();
    if (!apiReservations) return [];
    return this.mapApiReservationsToModel(apiReservations);
  });

  /**
   * Loading state for reservations
   */
  public readonly isLoadingReservations = computed(() => this.userReservationsResource.isLoading());

  /**
   * Charger slots query signals
   */
  private chargerIdForSlots = signal<string | null>(null);
  private dateForSlots = signal<string | undefined>(undefined);

  /**
   * Charger slots resource using httpResource
   */
  private chargerSlotsResource = this.bookingsApi.chargerSlotsResource(
    this.chargerIdForSlots,
    this.dateForSlots
  );

  /**
   * Current charger slots - computed from resource
   */
  public readonly chargerSlots = computed(() => this.chargerSlotsResource.value());

  /**
   * Loading state for charger slots
   */
  public readonly isLoadingChargerSlots = computed(() => this.chargerSlotsResource.isLoading());

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
    this.reservations().filter(r => 
      r.status === 'PENDING' || r.status === 'CONFIRMED'
    ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  );

  public readonly pastReservations = computed(() =>
    this.reservations().filter(r => 
      r.status === 'COMPLETED' || r.status === 'EXPIRED'
    ).sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
  );

  public readonly cancelledReservations = computed(() =>
    this.reservations().filter(r => r.status === 'CANCELLED')
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
      .pipe(
        filter((update: SlotUpdate) => this._subscribedChargerId() === update.chargerId),
        auditTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe((update: SlotUpdate) => {
        console.log('[ReservationService] Received slot update:', update);
        this.refreshReservationsForCharger(update);
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
   * Refresh user reservations
   * Triggers a reload of the userReservationsResource
   */
  refreshReservations(): void {
    this.userReservationsResource.reload();
  }

  /**
   * Load charger slots for a specific date
   * Updates the query signals which automatically triggers resource refetch
   * 
   * @param chargerId - The charger UUID
   * @param date - Optional date in YYYY-MM-DD format
   */
  loadChargerSlots(chargerId: string, date?: string): void {
    this.chargerIdForSlots.set(chargerId);
    this.dateForSlots.set(date);
  }

  /**
   * Clear charger slots
   */
  clearChargerSlots(): void {
    this.chargerIdForSlots.set(null);
    this.dateForSlots.set(undefined);
  }

  /**
   * Create a new reservation
   * After success, refreshes the reservations resource
   */
  createReservation(data: CreateReservationData): Observable<Reservation> {
    const request = {
      chargerId: data.chargerId,
      reservedFrom: data.startTime.toISOString(),
      reservedTo: data.endTime.toISOString(),
    };

    return this.bookingsApi.createReservation(request).pipe(
      map(apiReservation => this.mapSingleApiReservation(apiReservation)),
      tap(() => {
        // Refresh reservations to get the latest data
        this.refreshReservations();
      }),
      catchError(error => {
        console.error('[ReservationService] Failed to create reservation:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cancel a reservation
   * After success, refreshes the reservations resource
   */
  cancelReservation(id: string): Observable<boolean> {
    return this.bookingsApi.cancelReservation(id).pipe(
      map(() => true),
      tap(() => {
        // Refresh reservations to get the latest data
        this.refreshReservations();
      }),
      catchError(error => {
        console.error('[ReservationService] Failed to cancel reservation:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get reservations for a station on a specific date
   * Returns a computed value from the reservations signal
   * 
   * @deprecated Use chargerSlots resource instead for calendar views
   */
  getReservationsByStationAndDate(stationId: string, date: Date): Reservation[] {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Filter from reservations signal
    return this.reservations().filter(r =>
      r.stationId === stationId &&
      r.status !== 'CANCELLED' &&
      (
        (r.startTime >= startOfDay && r.startTime <= endOfDay) ||
        (r.endTime >= startOfDay && r.endTime <= endOfDay) ||
        (r.startTime < startOfDay && r.endTime > endOfDay)
      )
    );
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
    const conflictingReservations = this.reservations().filter(r =>
      r.stationId === stationId &&
      r.status !== 'CANCELLED' &&
      r.status !== 'COMPLETED' &&
      this.timeRangesOverlap(
        { start: r.startTime, end: r.endTime },
        timeRange
      )
    );

    const unavailableChargerIds = new Set(conflictingReservations.map(r => r.chargerId));
    return station.chargers.filter((c: Charger) => !unavailableChargerIds.has(c.id));
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
    const conflictingReservations = this.reservations().filter(r =>
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
    const charger = station?.chargers.find((c: Charger) => c.id === chargerId);

    if (!charger) return 0;

    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const rate = charger.currentRate || charger.powerKW * 0.35; // Default rate based on power
    return Math.round(durationHours * rate * 100) / 100;
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
  private refreshReservationsForCharger(update: SlotUpdate): void {
    const dateStr = this.dateForSlots();

    if (dateStr) {
      const selectedStart = new Date(`${dateStr}T00:00:00`);
      const selectedEnd = new Date(`${dateStr}T23:59:59.999`);
      const updateStart = new Date(update.reservedFrom);
      const updateEnd = new Date(update.reservedTo);

      const overlapsSelectedDate =
        updateStart < selectedEnd && updateEnd > selectedStart;

      if (!overlapsSelectedDate) {
        return;
      }
    }

    // Refresh the reservations resource to get latest data
    this.refreshReservations();

    // Also refresh charger slots if we're viewing that charger
    if (this.chargerIdForSlots() === update.chargerId) {
      this.chargerSlotsResource.reload();
    }
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
