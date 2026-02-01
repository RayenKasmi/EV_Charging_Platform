import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationCalendarViewComponent } from './reservation-calendar-view.component';
import { ReservationCreationFormComponent } from './reservation-creation-form.component';
import { MyReservationsPageComponent } from './my-reservations-page.component';
import { TimeRange } from '../../core/models/reservation.model';

type ViewMode = 'my-reservations' | 'new-reservation';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [
    CommonModule,
    ReservationCalendarViewComponent,
    ReservationCreationFormComponent,
    MyReservationsPageComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow">
        <div class="border-b border-gray-200 dark:border-slate-700">
          <nav class="flex -mb-px">
            <button
              (click)="selectView('my-reservations')"
              [class.border-blue-600]="currentView() === 'my-reservations'"
              [class.text-blue-600]="currentView() === 'my-reservations'"
              [class.dark:text-blue-400]="currentView() === 'my-reservations'"
              [class.border-transparent]="currentView() !== 'my-reservations'"
              [class.text-gray-500]="currentView() !== 'my-reservations'"
              [class.dark:text-gray-400]="currentView() !== 'my-reservations'"
              class="px-6 py-4 border-b-2 font-medium text-sm transition-colors hover:text-blue-600 dark:hover:text-blue-400">
              My Reservations
            </button>
            <button
              (click)="selectView('new-reservation')"
              [class.border-blue-600]="currentView() === 'new-reservation'"
              [class.text-blue-600]="currentView() === 'new-reservation'"
              [class.dark:text-blue-400]="currentView() === 'new-reservation'"
              [class.border-transparent]="currentView() !== 'new-reservation'"
              [class.text-gray-500]="currentView() !== 'new-reservation'"
              [class.dark:text-gray-400]="currentView() !== 'new-reservation'"
              class="px-6 py-4 border-b-2 font-medium text-sm transition-colors hover:text-blue-600 dark:hover:text-blue-400">
              New Reservation
            </button>
          </nav>
        </div>

        <div class="p-6">
          @if (currentView() === 'my-reservations') {
            <app-my-reservations-page></app-my-reservations-page>
          } @else if (currentView() === 'new-reservation') {
            <div class="space-y-6">
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2">
                  <app-reservation-calendar-view
                    [stationId]="selectedStationId()"
                    [selectedDate]="selectedDate()"
                    (timeRangeSelected)="onTimeRangeSelected($event)">
                  </app-reservation-calendar-view>
                </div>

                <div class="lg:col-span-1">
                  <app-reservation-creation-form
                    (reservationCreated)="onReservationCreated()">
                  </app-reservation-creation-form>
                </div>
              </div>

              @if (selectedTimeRange()) {
                <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p class="text-sm text-gray-700 dark:text-gray-300">
                    <span class="font-semibold">Time slot selected:</span>
                    {{ formatTime(selectedTimeRange()!.start) }} - {{ formatTime(selectedTimeRange()!.end) }}
                  </p>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class ReservationsComponent {
  currentView = signal<ViewMode>('my-reservations');
  selectedStationId = signal<string>('1');
  selectedDate = signal<Date>(new Date());
  selectedTimeRange = signal<TimeRange | null>(null);

  selectView(view: ViewMode) {
    this.currentView.set(view);
  }

  onTimeRangeSelected(timeRange: TimeRange) {
    this.selectedTimeRange.set(timeRange);
  }

  onReservationCreated() {
    this.selectedTimeRange.set(null);
    this.currentView.set('my-reservations');
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
}
