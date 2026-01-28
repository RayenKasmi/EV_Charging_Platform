import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MockDataService, Station, Charger } from '../../core/services/mock-data.service';

@Component({
  selector: 'app-station-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      @if (isLoading()) {
        <div class="flex justify-center items-center py-12">
          <p class="text-gray-500 dark:text-gray-400">Loading station details...</p>
        </div>
      } @else if (!station()) {
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <p class="text-red-700 dark:text-red-400 font-medium">Station not found</p>
          <a [routerLink]="['/stations']" class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 mt-2 inline-block">
            Back to Stations
          </a>
        </div>
      } @else {
        <div class="flex items-center justify-between mb-6">
          <a [routerLink]="['/stations']" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
            Back to Stations
          </a>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-lg shadow dark:shadow-slate-900/50 p-8 transition-colors">
          <div class="flex flex-col md:flex-row md:items-start md:justify-between mb-6 pb-6 border-b dark:border-slate-700">
            <div>
              <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">{{ station()!.name }}</h1>
              <p class="text-gray-600 dark:text-gray-400 text-lg">{{ station()!.location }}</p>
              <p class="text-gray-500 dark:text-gray-500">{{ station()!.city }}</p>
            </div>
            <div [ngClass]="getStatusBadgeClass(station()!.status)" class="px-4 py-2 rounded-lg text-lg font-semibold mt-4 md:mt-0 text-center md:text-left">
              {{ station()!.status }}
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
              <p class="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Price per kWh</p>
              <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {{ '$' + station()!.pricePerKwh.toFixed(2) }}
              </p>
            </div>
            <div class="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
              <p class="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Total Chargers</p>
              <p class="text-3xl font-bold text-green-600 dark:text-green-400">{{ station()!.chargers.length }}</p>
            </div>
            <div class="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4">
              <p class="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Available</p>
              <p class="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {{ getAvailableChargerCount() }}
              </p>
            </div>
          </div>

          <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-4">Available Chargers</h2>

          @if (station()!.chargers.length === 0) {
            <p class="text-gray-500 dark:text-gray-400">No chargers at this station</p>
          } @else {
            <div class="space-y-3">
              @for (charger of station()!.chargers; track charger.id) {
                <div
                  [ngClass]="getChargerBgClass(charger.status)"
                  class="border dark:border-slate-700 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between transition-colors"
                >
                  <div class="flex-1 mb-3 md:mb-0">
                    <div class="flex items-center gap-3 mb-2">
                      <div class="flex items-center gap-2">
                        <svg class="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0110 2v5H6.768a1 1 0 00-.928 1.487l3.834 6.77a1 1 0 001.928-.971L8.856 10h2.376a1 1 0 00.928-1.487l-3.834-6.77a1 1 0 00-.072-.097zM9 12a1 1 0 011 1v5h4.232a1 1 0 00.928-1.487l-3.834-6.77a1 1 0 00-1.928.971L11.144 10H8.768a1 1 0 00-.928 1.487l3.834 6.77a1 1 0 001.928-.971L11.856 12H9z" clip-rule="evenodd"></path></svg>
                        <h3 class="font-semibold text-gray-800 dark:text-white">
                          {{ charger.connectorType }} Connector
                        </h3>
                      </div>
                      <span [ngClass]="getChargerStatusClass(charger.status)" class="px-2 py-1 rounded text-xs font-medium">
                        {{ charger.status }}
                      </span>
                    </div>
                    <p class="text-gray-600 dark:text-gray-400 text-sm">{{ charger.power }} kW - Charger ID: {{ charger.id }}</p>
                  </div>

                  @if (charger.status === 'Available') {
                    <button (click)="startCharging(charger.id)" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 justify-center">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"></path></svg>
                      Start Charging
                    </button>
                  } @else {
                    <button disabled class="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg font-medium cursor-not-allowed flex items-center gap-2 justify-center">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path></svg>
                      Unavailable
                    </button>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `
})
export class StationDetailComponent implements OnInit {
  private mockDataService = inject(MockDataService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  station = signal<Station | undefined>(undefined);
  isLoading = signal(false);

  ngOnInit(): void {
    this.loadStation();
  }

  private loadStation(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.isLoading.set(true);
    this.mockDataService.getStationById(id).subscribe({
      next: (data) => {
        this.station.set(data);
        this.isLoading.set(false);
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800';
      case 'In Use':
        return 'bg-yellow-100 text-yellow-800';
      case 'Offline':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getChargerBgClass(status: string): string {
    switch (status) {
      case 'Available':
        return 'bg-green-50 border-green-200';
      case 'In Use':
        return 'bg-yellow-50 border-yellow-200';
      case 'Offline':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  }

  getChargerStatusClass(status: string): string {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800';
      case 'In Use':
        return 'bg-yellow-100 text-yellow-800';
      case 'Offline':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getAvailableChargerCount(): number {
    return this.station()?.chargers.filter(c => c.status === 'Available').length || 0;
  }

  startCharging(chargerId: string): void {
    const st = this.station();
    if (!st) return;
    this.mockDataService.startSession(st.id, chargerId);
    this.router.navigate(['/active-session']);
  }
}
