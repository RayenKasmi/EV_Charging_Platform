import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../core/services/mock-data.service';
import { signal } from '@angular/core';

interface Reservation {
  id: string;
  stationName: string;
  date: string;
  timeSlot: string;
}

interface BookingFormData {
  station: string;
  date: string;
  timeSlot: string;
  chargerType: string;
}

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full h-full bg-white dark:bg-slate-950 p-6 rounded-lg shadow-md">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Reservations</h2>

      <div class="grid grid-cols-3 gap-6 h-full">
        <!-- Reservations List -->
        <div class="col-span-2">
          <div class="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Reservations</h3>

            @if (reservations().length > 0) {
              <div class="space-y-3">
                @for (reservation of reservations(); track reservation.id) {
                  <div class="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg p-4 flex items-center justify-between hover:shadow-md dark:hover:shadow-lg transition-shadow">
                    <div class="flex-1">
                      <p class="font-semibold text-gray-900 dark:text-white">{{ reservation.stationName }}</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ formatDate(reservation.date) }} at {{ reservation.timeSlot }}</p>
                    </div>
                    <button
                      (click)="cancelReservation(reservation.id)"
                      class="ml-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 px-4 py-2 rounded-lg font-medium transition-colors duration-200">
                      Cancel
                    </button>
                  </div>
                }
              </div>
            } @else {
              <div class="flex flex-col items-center justify-center py-12">
                <svg class="w-12 h-12 text-gray-300 dark:text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <p class="text-gray-600 dark:text-gray-400 font-medium">No reservations yet</p>
                <p class="text-sm text-gray-500 dark:text-gray-500 mt-1">Book a charging slot to see it here</p>
              </div>
            }
          </div>
        </div>

        <!-- Booking Form -->
        <div class="col-span-1">
          <div class="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">New Reservation</h3>

            <form (ngSubmit)="bookReservation()" class="space-y-4">
              <!-- Station Dropdown -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Charging Station</label>
                <select
                  [(ngModel)]="formData.station"
                  name="station"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400">
                  <option value="">Select a station</option>
                  @for (station of availableStations(); track station) {
                    <option [value]="station">{{ station }}</option>
                  }
                </select>
              </div>

              <!-- Date Picker -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                <input
                  type="date"
                  [(ngModel)]="formData.date"
                  name="date"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400" />
              </div>

              <!-- Time Slot Dropdown -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time Slot</label>
                <select
                  [(ngModel)]="formData.timeSlot"
                  name="timeSlot"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400">
                  <option value="">Select time slot</option>
                  @for (slot of timeSlots; track slot) {
                    <option [value]="slot">{{ slot }}</option>
                  }
                </select>
              </div>

              <!-- Charger Type Dropdown -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Charger Type</label>
                <select
                  [(ngModel)]="formData.chargerType"
                  name="chargerType"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400">
                  <option value="">Select charger type</option>
                  @for (type of chargerTypes; track type) {
                    <option [value]="type">{{ type }}</option>
                  }
                </select>
              </div>

              <!-- Book Button -->
              <button
                type="submit"
                [disabled]="!isFormValid()"
                class="w-full bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                Book Now
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ReservationsComponent implements OnInit {
  private mockDataService = inject(MockDataService);

  reservations = signal<Reservation[]>([]);
  availableStations = signal<string[]>([
    'Downtown Charging Hub',
    'Airport Station',
    'Mall Plaza',
    'Highway Rest Stop',
    'University Campus'
  ]);

  formData = {
    station: '',
    date: '',
    timeSlot: '',
    chargerType: ''
  };

  timeSlots = [
    '08:00 - 10:00',
    '10:00 - 12:00',
    '12:00 - 14:00',
    '14:00 - 16:00',
    '16:00 - 18:00',
    '18:00 - 20:00'
  ];

  chargerTypes = [
    'Level 1 (120V)',
    'Level 2 (240V)',
    'DC Fast Charger',
    'Ultra-Fast DC Charger'
  ];

  ngOnInit() {
    this.loadReservations();
  }

  loadReservations() {
    const reservations = this.mockDataService.getReservationsSync();
    this.reservations.set(reservations);
  }

  isFormValid(): boolean {
    return (
      this.formData.station.trim() !== '' &&
      this.formData.date.trim() !== '' &&
      this.formData.timeSlot.trim() !== '' &&
      this.formData.chargerType.trim() !== ''
    );
  }

  bookReservation() {
    if (!this.isFormValid()) {
      return;
    }

    const newReservation: Reservation = {
      id: `RES-${Date.now()}`,
      stationName: this.formData.station,
      date: this.formData.date,
      timeSlot: this.formData.timeSlot
    };

    this.mockDataService.addReservation(newReservation);
    this.loadReservations();
    this.resetForm();
  }

  cancelReservation(id: string) {
    this.mockDataService.cancelReservation(id);
    this.loadReservations();
  }

  resetForm() {
    this.formData = {
      station: '',
      date: '',
      timeSlot: '',
      chargerType: ''
    };
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }
}
