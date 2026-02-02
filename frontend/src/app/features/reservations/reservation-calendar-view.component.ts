import { Component, Input, Output, EventEmitter, signal, computed, effect, ChangeDetectionStrategy, OnInit, OnDestroy, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { TimeSlot, TimeRange } from '@core/models/reservation.model';
import { ReservationService } from '@core/services/reservation.service';
import { AuthService } from '@core/services/auth.service';

/**
 * ReservationCalendarViewComponent
 * 
 * Displays a calendar view of time slots for a charger.
 * Integrates with WebSocket for real-time updates.
 * 
 * ## Real-time Updates Flow:
 * 1. Component subscribes to charger via WebSocket on init
 * 2. When another user creates a reservation, server broadcasts 'slotsUpdated'
 * 3. Component receives update via ReservationService.getSlotsUpdatesForCharger()
 * 4. Time slots are regenerated to reflect the new reservation
 */
@Component({
  selector: 'app-reservation-calendar-view',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reservation-calendar-view.component.html',
  styles: []
})
export class ReservationCalendarViewComponent implements OnInit, OnDestroy, OnChanges {
  private reservationService = inject(ReservationService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  @Input() stationId: string = '';
  @Input() chargerId: string = ''; // Charger ID for WebSocket subscription and API calls
  @Input() selectedDate: Date = new Date();
  @Output() timeRangeSelected = new EventEmitter<TimeRange>();

  timeSlots = signal<TimeSlot[]>([]);
  selectedRange = signal<TimeRange | null>(null);
  isLoading = signal(false);
  
  // Get current user ID for identifying own reservations
  private currentUserId = computed(() => this.authService.currentUser()?.id || '');

  private isDragging = false;
  private selectionStart: Date | null = null;

  hours = Array.from({ length: 24 }, (_, i) => i);

  ngOnInit() {
    this.generateTimeSlots();
    this.setupWebSocketSubscription();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Reload when chargerId or selectedDate changes
    if (changes['chargerId'] || changes['selectedDate']) {
      if (!changes['chargerId']?.firstChange && !changes['selectedDate']?.firstChange) {
        this.generateTimeSlots();
        
        // Re-setup WebSocket if chargerId changed
        if (changes['chargerId']) {
          const previousChargerId = changes['chargerId'].previousValue;
          if (previousChargerId) {
            this.reservationService.unsubscribeFromCharger(previousChargerId);
          }
          this.setupWebSocketSubscription();
        }
      }
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Unsubscribe from charger when component is destroyed
    if (this.chargerId) {
      this.reservationService.unsubscribeFromCharger(this.chargerId);
    }
  }

  /**
   * Subscribe to real-time updates for the current charger
   */
  private setupWebSocketSubscription(): void {
    if (this.chargerId) {
      // Subscribe to charger updates via WebSocket
      this.reservationService.subscribeToCharger(this.chargerId);

      // Listen for slot updates and refresh the calendar
      this.reservationService.getSlotsUpdatesForCharger(this.chargerId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(update => {
          console.log('[Calendar] Received slot update:', update);
          // Regenerate time slots to reflect the update
          this.loadReservations();
        });
    }
  }

  private generateTimeSlots() {
    const date = this.selectedDate;
    const slots: TimeSlot[] = [];
    const now = new Date();

    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const slotTime = new Date(date);
        slotTime.setHours(hour, minute, 0, 0);

        slots.push({
          time: slotTime,
          status: slotTime < now ? 'past' : 'available'
        });
      }
    }

    this.timeSlots.set(slots);
    this.loadReservations();
  }

  /**
   * Load reservations from the backend API
   * Uses chargerId to fetch slots if available, otherwise falls back to station-based filtering
   */
  private loadReservations() {
    // If we have a chargerId, use the charger slots API (preferred)
    if (this.chargerId) {
      this.loadChargerSlots();
      return;
    }

    // Fallback: If only stationId is available, use local cache filtering
    // (This is less reliable as it depends on data being pre-loaded)
    const stationId = this.stationId;
    const date = this.selectedDate;

    if (!stationId) return;

    this.isLoading.set(true);

    this.reservationService.getReservationsByStationAndDate(stationId, date).subscribe({
      next: (reservations) => {
        this.updateTimeSlotsWithReservations(reservations);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Load charger slots from the backend API
   * This is the primary method for fetching reservations for a specific charger
   */
  private loadChargerSlots() {
    if (!this.chargerId) return;

    this.isLoading.set(true);

    // Format date as YYYY-MM-DD for the API
    const dateStr = this.formatDateForApi(this.selectedDate);

    this.reservationService.getChargerSlots(this.chargerId, dateStr).subscribe({
      next: (response) => {
        // Map API response reservations to our slot format
        const currentUserId = this.currentUserId();
        
        this.timeSlots.update(slots => {
          return slots.map(slot => {
            // Find if this slot overlaps with any reservation
            const reservation = response.reservations.find(r => {
              const reservedFrom = new Date(r.reservedFrom);
              const reservedTo = new Date(r.reservedTo);
              return slot.time >= reservedFrom && slot.time < reservedTo;
            });

            if (reservation) {
              // Determine if this is the current user's reservation
              const isOwnReservation = currentUserId && reservation.userId === currentUserId;
              return {
                ...slot,
                status: isOwnReservation ? 'my-reservation' as const : 'reserved' as const,
                reservationId: reservation.id
              };
            }

            return slot;
          });
        });

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('[Calendar] Failed to load charger slots:', error);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Update time slots with reservation data
   */
  private updateTimeSlotsWithReservations(reservations: { startTime: Date; endTime: Date; userId: string; id: string }[]) {
    const currentUserId = this.currentUserId();

    this.timeSlots.update(slots => {
      return slots.map(slot => {
        const reservation = reservations.find(r => {
          return slot.time >= r.startTime && slot.time < r.endTime;
        });

        if (reservation) {
          return {
            ...slot,
            status: reservation.userId === currentUserId ? 'my-reservation' : 'reserved',
            reservationId: reservation.id
          };
        }

        return slot;
      });
    });
  }

  private formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  startSelection(slot: TimeSlot) {
    if (slot.status === 'past' || slot.status === 'reserved') return;

    this.isDragging = true;
    this.selectionStart = slot.time;
    this.selectedRange.set({ start: slot.time, end: new Date(slot.time.getTime() + 15 * 60 * 1000) });
  }

  updateSelection(slot: TimeSlot) {
    if (!this.isDragging || !this.selectionStart) return;
    if (slot.status === 'past' || slot.status === 'reserved') return;

    const start = this.selectionStart < slot.time ? this.selectionStart : slot.time;
    const end = this.selectionStart < slot.time ?
      new Date(slot.time.getTime() + 15 * 60 * 1000) :
      new Date(this.selectionStart.getTime() + 15 * 60 * 1000);

    // Check if the range includes any reserved/past slots
    const hasConflict = this.timeSlots().some(s => 
      s.time >= start && s.time < end && (s.status === 'past' || s.status === 'reserved')
    );

    if (!hasConflict) {
      this.selectedRange.set({ start, end });
    }
  }

  endSelection() {
    if (this.isDragging && this.selectedRange()) {
      const range = this.selectedRange()!;
      this.timeRangeSelected.emit(range);
    }

    this.isDragging = false;
  }

  getSlotClass(slot: TimeSlot): string {
    const range = this.selectedRange();
    const isSelected = range && slot.time >= range.start && slot.time < range.end;

    if (isSelected) {
      return 'bg-blue-500 border border-blue-600';
    }

    switch (slot.status) {
      case 'available':
        return 'bg-green-500 hover:bg-green-600';
      case 'my-reservation':
        return 'bg-yellow-500';
      case 'reserved':
        return 'bg-red-500 cursor-not-allowed';
      case 'past':
        return 'bg-gray-400 cursor-not-allowed';
      default:
        return 'bg-gray-300';
    }
  }

  getSlotTitle(slot: TimeSlot): string {
    const timeStr = this.formatTime(slot.time);
    switch (slot.status) {
      case 'available':
        return `${timeStr} - Available`;
      case 'my-reservation':
        return `${timeStr} - Your Reservation`;
      case 'reserved':
        return `${timeStr} - Reserved`;
      case 'past':
        return `${timeStr} - Past`;
      default:
        return timeStr;
    }
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  formatHour(hour: number): string {
    const date = new Date();
    date.setHours(hour, 0, 0, 0);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', hour12: true });
  }
}
