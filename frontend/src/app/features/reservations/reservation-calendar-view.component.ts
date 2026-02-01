import { Component, Input, Output, EventEmitter, signal, computed, effect, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeSlot, TimeRange } from '../../core/models/reservation.model';
import { ReservationService } from '../../core/services/reservation.service';

@Component({
  selector: 'app-reservation-calendar-view',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Select Time Slot</h3>
        @if (selectedRange()) {
          <div class="text-sm text-gray-600 dark:text-gray-400">
            <span class="font-medium">Selected: </span>
            {{ formatTime(selectedRange()!.start) }} - {{ formatTime(selectedRange()!.end) }}
          </div>
        }
      </div>

      @if (isLoading()) {
        <div class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      } @else {
        <div class="h-[500px] overflow-y-auto border border-gray-200 dark:border-slate-700 rounded-lg">
          <div class="grid grid-cols-[auto_1fr] min-h-full">
            <div class="flex flex-col border-r border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 sticky left-0 z-10">
              @for (hour of hours; track hour) {
                <div class="h-16 flex items-start justify-end pr-2 pt-1 text-xs text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-slate-800 w-16">
                  {{ formatHour(hour) }}
                </div>
              }
            </div>

            <div class="flex flex-col w-full relative bg-gray-50 dark:bg-slate-800">
              @for (slot of timeSlots(); track slot.time.getTime()) {
                <div
                  [ngClass]="getSlotClass(slot)"
                  class="h-4 w-full border-b border-gray-100 dark:border-slate-700/50 cursor-pointer transition-colors"
                  (mousedown)="startSelection(slot)"
                  (mouseenter)="updateSelection(slot)"
                  (mouseup)="endSelection()"
                  [title]="getSlotTitle(slot)">
                </div>
              }
            </div>
          </div>
        </div>

        <div class="mt-4 flex items-center gap-4 text-xs">
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 bg-green-500 rounded"></div>
            <span class="text-gray-600 dark:text-gray-400">Available</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 bg-blue-500 rounded"></div>
            <span class="text-gray-600 dark:text-gray-400">Selected</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 bg-yellow-500 rounded"></div>
            <span class="text-gray-600 dark:text-gray-400">My Reservation</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 bg-red-500 rounded"></div>
            <span class="text-gray-600 dark:text-gray-400">Reserved</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 bg-gray-400 rounded"></div>
            <span class="text-gray-600 dark:text-gray-400">Past</span>
          </div>
        </div>
      }
    </div>
  `,
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

    this.selectedRange.set({ start, end });
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
