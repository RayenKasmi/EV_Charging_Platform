import { Component, signal, ChangeDetectionStrategy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationCalendarViewComponent } from './reservation-calendar-view.component';
import { ReservationCreationFormComponent } from './reservation-creation-form.component';
import { MyReservationsPageComponent } from './my-reservations-page.component';
import { TimeRange } from '@core/models/reservation.model';
import { Station, Charger } from '@core/models/stations.model';
import { ReservationService } from '@core/services/reservation.service';

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
  private readonly reservationService = inject(ReservationService);

  currentView = signal<ViewMode>('my-reservations');
  selectedStationId = signal<string>('');
  selectedChargerId = signal<string>('');
  selectedDate = signal<Date>(new Date());
  selectedTimeRange = signal<TimeRange | null>(null);

  // Station and charger lists from the service (computed signal - auto-updates)
  stations = this.reservationService.stations;
  isLoadingStations = this.reservationService.isLoadingStations;
  
  selectedStation = signal<Station | null>(null);
  chargers = signal<Charger[]>([]);

  constructor() {
    // Effect to auto-select first station when stations load
    effect(() => {
      const stationList = this.stations();
      if (stationList.length > 0 && !this.selectedStationId()) {
        this.onStationChange(stationList[0].id);
      }
    });
  }

  onStationChange(stationId: string): void {
    this.selectedStationId.set(stationId);
    this.selectedChargerId.set('');
    this.selectedTimeRange.set(null);

    const station = this.stations().find(s => s.id === stationId);
    this.selectedStation.set(station || null);
    this.chargers.set(station?.chargers || []);

    // Auto-select first charger if available
    if (station && station.chargers.length > 0) {
      this.onChargerChange(station.chargers[0].id);
    }
  }

  onChargerChange(chargerId: string): void {
    this.selectedChargerId.set(chargerId);
    this.selectedTimeRange.set(null);
  }

  onDateChange(dateValue: Date | null): void {
    this.selectedDate.set(dateValue || new Date());
  }

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
