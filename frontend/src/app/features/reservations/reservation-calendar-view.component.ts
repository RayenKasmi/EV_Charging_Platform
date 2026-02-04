import { Component, input, Output, EventEmitter, signal, computed, effect, ChangeDetectionStrategy, OnDestroy, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, distinctUntilChanged, filter, switchMap, tap, finalize, EMPTY } from 'rxjs';
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
export class ReservationCalendarViewComponent implements OnDestroy {
  private reservationService = inject(ReservationService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  // Signal inputs
  stationId = input.required<string>();
  chargerId = input.required<string>();
  selectedDate = input<Date>(new Date());

  @Output() timeRangeSelected = new EventEmitter<TimeRange>();

  timeSlots = signal<TimeSlot[]>([]);
  selectedRange = signal<TimeRange | null>(null);
  
  // Get current user ID for identifying own reservations
  private currentUserId = computed(() => this.authService.currentUser()?.id || '');

  // Charger slots from service - reactive to chargerId and date changes
  chargerSlots = computed(() => this.reservationService.chargerSlots());
  isLoading = computed(() => this.reservationService.isLoadingChargerSlots());

  private isDragging = false;
  private selectionStart: Date | null = null;

  hours = Array.from({ length: 24 }, (_, i) => i);

  constructor() {
    // Effect to load charger slots when inputs change
    effect(() => {
      const charger = this.chargerId();
      const date = this.selectedDate();
      
      if (charger && date) {
        const dateStr = this.formatDateForApi(date);
        this.reservationService.loadChargerSlots(charger, dateStr);
        this.generateTimeSlots();
      }
    });

    // Effect to update time slots when charger slots data changes
    effect(() => {
      const slotsData = this.chargerSlots();
      if (slotsData) {
        this.updateTimeSlotsWithChargerSlots(slotsData);
      }
    });

    // Setup WebSocket subscription
    this.setupWebSocketSubscription();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Unsubscribe from charger when component is destroyed
    const charger = this.chargerId();
    if (charger) {
      this.reservationService.unsubscribeFromCharger(charger);
    }
    
    // Clear charger slots
    this.reservationService.clearChargerSlots();
  }

  /**
   * Subscribe to real-time updates for the current charger
   */
  private setupWebSocketSubscription(): void {
    // Subscribe to WebSocket updates based on chargerId without writing to signals inside effects
    toObservable(this.chargerId)
      .pipe(
        distinctUntilChanged(),
        filter((charger): charger is string => Boolean(charger)), //skips empty/undefined chargers
        switchMap(charger => {   //cancels previous streams (getslotupdatesforcharger)
          this.reservationService.subscribeToCharger(charger);

          return this.reservationService.getSlotsUpdatesForCharger(charger).pipe( 
            tap(update => {
              console.log('[Calendar] Received slot update:', update);
              this.reservationService.loadChargerSlots(
                charger,
                this.formatDateForApi(this.selectedDate())
              );
            }),
            finalize(() => this.reservationService.unsubscribeFromCharger(charger)) //runs when the stream completes or is canceled
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  private generateTimeSlots() {
    const date = this.selectedDate();
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
  }

  /**
   * Update time slots with charger slots data from httpResource
   */
  private updateTimeSlotsWithChargerSlots(response: any) {
    if (!response || !response.reservations) return;

    const currentUserId = this.currentUserId();
    
    this.timeSlots.update(slots => {
      return slots.map(slot => {
        // Find if this slot overlaps with any reservation
        const reservation = response.reservations.find((r: any) => {
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

        // Reset to available or past
        const now = new Date();
        return {
          ...slot,
          status: slot.time < now ? 'past' as const : 'available' as const,
          reservationId: undefined
        };
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