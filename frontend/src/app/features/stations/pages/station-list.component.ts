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
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">EV Charging Stations</h2>
        <p class="text-gray-600 mt-1">Browse available charging stations</p>
      </div>

      <div *ngIf="isLoading(); else stationsView" class="flex justify-center">
        <app-spinner [size]="50"></app-spinner>
      </div>

      <ng-template #stationsView>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let station of stations()" 
               class="cursor-pointer hover:shadow-lg transition-shadow">
            <app-card>
              <div class="space-y-3">
                <div class="flex justify-between items-start">
                  <h3 class="font-bold text-lg text-gray-900">{{ station.name }}</h3>
                  <app-badge [status]="station.status === 'ACTIVE' ? 'success' : 'warning'">
                    {{ station.status }}
                  </app-badge>
                </div>

                <p class="text-gray-600 text-sm">📍 {{ station.location.address }}</p>
                <p class="text-gray-600 text-sm">{{ station.location.city }}, {{ station.location.state }}</p>

                <div class="border-t border-gray-200 pt-3 space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Available Chargers:</span>
                    <span class="font-semibold text-blue-600">{{ station.availableChargers }}/{{ station.totalChargers }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Base Rate:</span>
                    <span class="font-semibold">${'$'}{{ formatPrice(station.pricing.baseRate) }}/kWh</span>
                  </div>
                </div>
              </div>
            </app-card>
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
}
