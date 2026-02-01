import { Component, Input, Output, EventEmitter, signal, computed, effect, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeSlot, TimeRange } from '@core/models/reservation.model';
import { ReservationService } from '@core/services/reservation.service';

@Component({
  selector: 'app-reservation-calendar-view',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reservation-calendar-view.component.html',
  styles: []
})
export class ReservationCalendarViewComponent implements OnInit {
  private reservationService = inject(ReservationService);

  @Input() stationId: string = '';
  @Input() selectedDate: Date = new Date();
  @Output() timeRangeSelected = new EventEmitter<TimeRange>();

  timeSlots = signal<TimeSlot[]>([]);
  selectedRange = signal<TimeRange | null>(null);
  isLoading = signal(false);

  private isDragging = false;
  private selectionStart: Date | null = null;

  hours = Array.from({ length: 24 }, (_, i) => i);

  ngOnInit() {
    this.generateTimeSlots();
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

  private loadReservations() {
    const stationId = this.stationId;
    const date = this.selectedDate;

    if (!stationId) return;

    this.isLoading.set(true);

    this.reservationService.getReservationsByStationAndDate(stationId, date).subscribe({
      next: (reservations) => {
        this.timeSlots.update(slots => {
          return slots.map(slot => {
            const reservation = reservations.find(r => {
              return slot.time >= r.startTime && slot.time < r.endTime;
            });

            if (reservation) {
              return {
                ...slot,
                status: reservation.userId === '1' ? 'my-reservation' : 'reserved',
                reservationId: reservation.id
              };
            }

            return slot;
          });
        });

        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
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
