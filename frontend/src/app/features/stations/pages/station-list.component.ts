import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardComponent, SpinnerComponent, BadgeComponent } from '../../../shared/components';
import { DummyDataService } from '../../../core/services/dummy-data.service';
import { Station } from '../../../core/models';

@Component({
  selector: 'app-station-list',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, SpinnerComponent, BadgeComponent],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div>
        <h2 class="text-4xl font-bold bg-gradient-to-r from-slate-900 to-primary-900 bg-clip-text text-transparent">EV Charging Stations ⚡</h2>
        <p class="text-slate-600 mt-2 text-lg">Discover and explore available charging stations near you</p>
      </div>

      <div *ngIf="isLoading(); else stationsView" class="flex justify-center py-16">
        <app-spinner [size]="50"></app-spinner>
      </div>

      <ng-template #stationsView>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let station of stations()" 
               class="group cursor-pointer transition-all duration-300">
            <!-- Station Card -->
            <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
              <!-- Header with Status -->
              <div class="bg-gradient-to-r from-primary-50 to-secondary-50 px-6 py-4 border-b border-slate-200">
                <div class="flex justify-between items-start gap-3">
                  <div>
                    <h3 class="font-bold text-lg text-slate-900 group-hover:text-primary-600 transition-colors">{{ station.name }}</h3>
                    <p class="text-slate-600 text-sm mt-1">{{ station.location.address }}</p>
                  </div>
                  <div *ngIf="station.status === 'ACTIVE'" class="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-xs font-bold flex items-center gap-1">
                    <span class="status-dot status-active animate-pulse"></span>
                    Active
                  </div>
                  <div *ngIf="station.status !== 'ACTIVE'" class="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold flex items-center gap-1">
                    <span class="status-dot status-inactive"></span>
                    Offline
                  </div>
                </div>
              </div>

              <!-- Body -->
              <div class="px-6 py-5 space-y-5">
                <!-- Location Info -->
                <div class="flex items-start gap-3 text-slate-700">
                  <span class="text-xl">📍</span>
                  <div class="text-sm">
                    <p class="font-medium text-slate-900">{{ station.location.city }}, {{ station.location.state }}</p>
                    <p class="text-slate-600 mt-0.5">{{ station.location.zipCode }}</p>
                  </div>
                </div>

                <!-- Chargers Availability -->
                <div class="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-4 border border-primary-200">
                  <div class="flex items-center justify-between mb-3">
                    <span class="text-sm font-semibold text-primary-900">Chargers Available</span>
                    <span class="text-xs font-bold text-primary-600 bg-white px-2 py-1 rounded-full">{{ getUtilization(station) }}%</span>
                  </div>
                  <div class="text-2xl font-bold text-primary-600">{{ station.availableChargers }}<span class="text-lg text-primary-500">/{{ station.totalChargers }}</span></div>
                  <div class="bg-primary-300 rounded-full h-2 mt-3 overflow-hidden">
                    <div class="bg-gradient-to-r from-primary-400 to-primary-600 h-2 rounded-full" 
                         [style.width.%]="getUtilization(station)"></div>
                  </div>
                </div>

                <!-- Pricing -->
                <div class="bg-gradient-to-r from-accent-50 to-accent-100 rounded-xl p-4 border border-accent-200">
                  <p class="text-sm font-semibold text-accent-900 mb-2">💰 Base Rate</p>
                  <p class="text-2xl font-bold text-accent-600">${'$'}{{ formatPrice(station.pricing.baseRate) }}<span class="text-sm text-accent-500">/kWh</span></p>
                </div>
              </div>

              <!-- Footer -->
              <div class="px-6 py-3 bg-slate-50 border-t border-slate-200">
                <a routerLink="['/dashboard/stations', station.id]" class="text-primary-600 font-semibold text-sm hover:text-primary-700 flex items-center gap-2 group/link">
                  View Details
                  <span class="group-hover/link:translate-x-1 transition-transform">→</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </ng-template>
    </div>
  `,
})
export class StationListComponent implements OnInit {
  stations = signal<Station[]>([]);
  isLoading = signal(true);

  constructor(private dummyDataService: DummyDataService) {}

  ngOnInit(): void {
    this.loadStations();
  }

  loadStations(): void {
    this.isLoading.set(true);
    this.dummyDataService.getStations().subscribe({
      next: (data) => {
        this.stations.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading stations:', err);
        this.isLoading.set(false);
      },
    });
  }

  formatPrice(price: number): string {
    return price.toFixed(2);
  }

  getUtilization(station: Station): number {
    const utilization = ((station.totalChargers - station.availableChargers) / station.totalChargers) * 100;
    return Math.round(utilization);
  }
}
