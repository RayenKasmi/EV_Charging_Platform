import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MockDataService, Station, ConnectorType } from '../../core/services/mock-data.service';

@Component({
  selector: 'app-stations',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">Charging Stations</h1>
        <p class="text-gray-600 dark:text-gray-400">Find and manage EV charging stations</p>
      </div>

      <div class="bg-white dark:bg-slate-800 rounded-lg shadow dark:shadow-slate-900/50 p-6 transition-colors">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Status
            </label>
            <select
              [value]="selectedStatus()"
              (change)="onStatusChange($event)"
              class="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            >
              <option value="">All Status</option>
              <option value="Available">Available</option>
              <option value="In Use">In Use</option>
              <option value="Offline">Offline</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Connector Type
            </label>
            <select
              [value]="selectedConnector()"
              (change)="onConnectorChange($event)"
              class="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            >
              <option value="">All Connectors</option>
              <option value="Type 2">Type 2</option>
              <option value="CCS">CCS</option>
              <option value="CHAdeMO">CHAdeMO</option>
            </select>
          </div>
        </div>

        @if (isLoading()) {
          <div class="flex justify-center items-center py-12">
            <p class="text-gray-500 dark:text-gray-400">Loading stations...</p>
          </div>
        } @else if (filteredStations().length === 0) {
          <div class="flex justify-center items-center py-12">
            <p class="text-gray-500 dark:text-gray-400">No stations match your filters</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (station of filteredStations(); track station.id) {
              <div
                class="border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg p-5 hover:shadow-lg dark:hover:shadow-slate-900/50 transition-all cursor-pointer"
                [routerLink]="['/stations', station.id]"
              >
                <div class="flex items-start justify-between mb-3">
                  <div>
                    <h3 class="font-bold text-gray-800 dark:text-white">{{ station.name }}</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">{{ station.city }}</p>
                  </div>
                  <div [ngClass]="getStatusBadgeClass(station.status)" class="px-3 py-1 rounded-full text-xs font-semibold">
                    {{ station.status }}
                  </div>
                </div>

                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">{{ station.location }}</p>

                <div class="flex items-center justify-between mb-3">
                  <span class="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {{ '$' + station.pricePerKwh.toFixed(2) }}/kWh
                  </span>
                  <span class="text-sm text-gray-500 dark:text-gray-400">
                    {{ station.chargers.length }} chargers
                  </span>
                </div>

                <div class="flex gap-2 flex-wrap">
                  @for (connector of getUniqueConnectors(station); track connector) {
                    <span class="px-2 py-1 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs rounded font-medium">
                      {{ connector }}
                    </span>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class StationsComponent implements OnInit {
  private mockDataService = inject(MockDataService);

  stations = signal<Station[]>([]);
  isLoading = signal(false);
  selectedStatus = signal<string>('');
  selectedConnector = signal<string>('');

  filteredStations = computed(() => {
    const status = this.selectedStatus();
    const connector = this.selectedConnector();

    return this.stations().filter(station => {
      const statusMatch = !status || station.status === status;
      const connectorMatch = !connector ||
        station.chargers.some(c => c.connectorType === connector);
      return statusMatch && connectorMatch;
    });
  });

  ngOnInit(): void {
    this.loadStations();
  }

  private loadStations(): void {
    this.isLoading.set(true);
    this.mockDataService.getStations().subscribe({
      next: (data) => {
        this.stations.set(data);
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

  getUniqueConnectors(station: Station): ConnectorType[] {
    return [...new Set(station.chargers.map(c => c.connectorType))];
  }

  onStatusChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedStatus.set(target.value);
  }

  onConnectorChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedConnector.set(target.value);
  }
}
