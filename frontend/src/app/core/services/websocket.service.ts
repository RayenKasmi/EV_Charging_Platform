import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject, BehaviorSubject, fromEvent, takeUntil, shareReplay, filter } from 'rxjs';
import { environment } from '@env/environment';
import { StationAvailability } from '../models/stations.model';

/**
 * WebSocket Events emitted by the server
 */
export interface ChargerStatusUpdate {
  chargerId: string;
  stationId: string;
  status: string;
  updatedAt: Date;
}

export interface SlotUpdate {
  chargerId: string;
  stationId: string;
  reservedFrom: Date;
  reservedTo: Date;
  action: 'created' | 'cancelled' | 'expired';
}

/**
 * WebSocketService
 * 
 * This service manages real-time WebSocket connections using Socket.io.
 * 
 * ## Why Socket.io?
 * - Built-in reconnection logic
 * - Room-based subscriptions (subscribe to specific chargers/stations)
 * - Fallback to HTTP long-polling if WebSocket is not available
 * - Binary and JSON message support
 * 
 * ## RxJS Integration
 * We wrap Socket.io events in RxJS Observables for several reasons:
 * 1. **Unified API**: Components can use the same reactive patterns (subscribe, pipe, operators)
 * 2. **Automatic cleanup**: Using takeUntil pattern for automatic unsubscription
 * 3. **Composability**: Can combine with other observables (e.g., HTTP responses)
 * 4. **Hot Observables**: Multiple subscribers receive the same events (using shareReplay)
 * 
 * ## Signals Integration
 * We use Angular Signals for connection state because:
 * 1. **Synchronous reads**: Components can check connection status instantly
 * 2. **Change detection**: Angular automatically updates views when signal changes
 * 3. **No subscription management**: Unlike BehaviorSubject, no need to unsubscribe
 */
@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private socket: Socket | null = null;
  private destroy$ = new Subject<void>();

  // Connection state as signals (synchronous, reactive UI state)
  private _isConnected = signal(false);
  private _connectionError = signal<string | null>(null);

  // Public readonly signals for components
  public readonly isConnected = this._isConnected.asReadonly();
  public readonly connectionError = this._connectionError.asReadonly();

  // Event subjects for multicasting (Hot Observables)
  private chargerStatusSubject = new Subject<ChargerStatusUpdate>();
  private slotsUpdateSubject = new Subject<SlotUpdate>();
  private stationAvailabilitySubject = new Subject<StationAvailability>();

  // Shared observables (shareReplay ensures late subscribers get last value)
  public readonly chargerStatus$ = this.chargerStatusSubject.asObservable().pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public readonly slotsUpdate$ = this.slotsUpdateSubject.asObservable();

  public readonly stationAvailability$ = this.stationAvailabilitySubject.asObservable().pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor() {
    this.connect();
  }

  /**
   * Establish WebSocket connection to the backend
   */
  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    // Parse the WebSocket URL from environment
    const wsUrl = environment.wsUrl || environment.apiUrl;

    this.socket = io(`${wsUrl}/ws`, {
      transports: ['websocket', 'polling'], // Prefer WebSocket, fallback to polling
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.setupEventListeners();
  }

  /**
   * Setup all Socket.io event listeners
   * Events are piped through RxJS Subjects for reactive consumption
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected:', this.socket?.id);
      this._isConnected.set(true);
      this._connectionError.set(null);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      this._isConnected.set(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
      this._connectionError.set(error.message);
      this._isConnected.set(false);
    });

    // Business events - pipe through subjects
    this.socket.on('chargerStatusUpdated', (data: ChargerStatusUpdate) => {
      console.log('[WebSocket] Charger status updated:', data);
      this.chargerStatusSubject.next(data);
    });

    this.socket.on('slotsUpdated', (data: SlotUpdate) => {
      console.log('[WebSocket] Slots updated:', data);
      this.slotsUpdateSubject.next({
        ...data,
        reservedFrom: new Date(data.reservedFrom),
        reservedTo: new Date(data.reservedTo),
      });
    });

    this.socket.on('stationAvailability', (data: StationAvailability) => {
      console.log('[WebSocket] Station availability:', data);
      this.stationAvailabilitySubject.next(data);
    });

    this.socket.on('chargerAvailability', (data: any) => {
      console.log('[WebSocket] Charger availability:', data);
    });

    // Subscription acknowledgements
    this.socket.on('subscribed', (data: { room: string; chargerId?: string; stationId?: string }) => {
      console.log('[WebSocket] Subscribed to room:', data.room);
    });

    this.socket.on('unsubscribed', (data: { room: string }) => {
      console.log('[WebSocket] Unsubscribed from room:', data.room);
    });
  }

  /**
   * Subscribe to a specific charger's real-time updates
   * Creates a room subscription on the server side
   * 
   * @param chargerId - The charger UUID to subscribe to
   */
  subscribeToCharger(chargerId: string): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot subscribe: not connected');
      return;
    }

    console.log('[WebSocket] Subscribing to charger:', chargerId);
    this.socket.emit('subscribeToCharger', { chargerId });
  }

  /**
   * Unsubscribe from a charger's updates
   */
  unsubscribeFromCharger(chargerId: string): void {
    if (!this.socket?.connected) return;

    console.log('[WebSocket] Unsubscribing from charger:', chargerId);
    this.socket.emit('unsubscribeFromCharger', { chargerId });
  }

  /**
   * Subscribe to a station's updates (all chargers in that station)
   */
  subscribeToStation(stationId: string): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot subscribe: not connected');
      return;
    }

    console.log('[WebSocket] Subscribing to station:', stationId);
    this.socket.emit('subscribeToStation', { stationId });
  }

  /**
   * Unsubscribe from a station's updates
   */
  unsubscribeFromStation(stationId: string): void {
    if (!this.socket?.connected) return;

    console.log('[WebSocket] Unsubscribing from station:', stationId);
    this.socket.emit('unsubscribeFromStation', { stationId });
  }

  /**
   * Get an observable that filters slot updates for a specific charger
   * Uses RxJS filter operator to create charger-specific streams
   */
  getSlotsUpdatesForCharger(chargerId: string): Observable<SlotUpdate> {
    return this.slotsUpdate$.pipe(
      filter(update => update.chargerId === chargerId),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Get an observable that filters status updates for a specific charger
   */
  getStatusUpdatesForCharger(chargerId: string): Observable<ChargerStatusUpdate> {
    return this.chargerStatus$.pipe(
      filter(update => update.chargerId === chargerId),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this._isConnected.set(false);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }
}
