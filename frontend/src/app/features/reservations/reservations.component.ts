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
  templateUrl: './reservations.component.html'
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
