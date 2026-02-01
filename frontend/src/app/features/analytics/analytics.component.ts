import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockDataService } from '../../core/services/mock-data.service';
import { signal } from '@angular/core';

interface ChargingSession {
  id: string;
  stationName: string;
  date: string;
  energy: number;
  cost: number;
}

interface AnalyticsData {
  totalEnergy: number;
  totalSpent: number;
  avgPerSession: number;
}

interface BarChartData {
  label: string;
  value: number;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full bg-white dark:bg-slate-950 p-6 rounded-lg shadow-md">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Charging Analytics</h2>

      @if (sessions().length > 0) {
        <div class="space-y-8">
          <!-- Summary Cards -->
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Energy</p>
              <p class="text-4xl font-bold text-blue-600 dark:text-blue-400">{{ analytics().totalEnergy.toFixed(2) }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-500 mt-2">kWh</p>
            </div>
            <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Spent</p>
              <p class="text-4xl font-bold text-green-600 dark:text-green-400">{{ formatCurrency(analytics().totalSpent) }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-500 mt-2">USD</p>
            </div>
            <div class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Avg per Session</p>
              <p class="text-4xl font-bold text-orange-600 dark:text-orange-400">{{ analytics().avgPerSession.toFixed(2) }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-500 mt-2">kWh</p>
            </div>
          </div>

          <!-- Bar Chart -->
          <div class="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Energy by Session</h3>
            <div class="space-y-3">
              @for (dataPoint of chartData(); track dataPoint.label) {
                <div>
                  <div class="flex justify-between items-center mb-1">
                    <p class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ dataPoint.label }}</p>
                    <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ dataPoint.value.toFixed(1) }} kWh</p>
                  </div>
                  <div class="w-full bg-gray-300 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div
                      class="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full"
                      [style.width.%]="getBarWidth(dataPoint.value)">
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Sessions Table -->
          <div class="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <div class="p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Session History</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="bg-gray-100 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                    <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Station Name</th>
                    <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
                    <th class="px-6 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Energy (kWh)</th>
                    <th class="px-6 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  @for (session of sessions(); track session.id) {
                    <tr class="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td class="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">{{ session.stationName }}</td>
                      <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{{ formatDate(session.date) }}</td>
                      <td class="px-6 py-4 text-sm text-gray-900 dark:text-white font-semibold text-right">{{ session.energy.toFixed(2) }}</td>
                      <td class="px-6 py-4 text-sm text-gray-900 dark:text-white font-semibold text-right">{{ formatCurrency(session.cost) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      } @else {
        <div class="flex flex-col items-center justify-center py-16">
          <svg class="w-16 h-16 text-gray-300 dark:text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <p class="text-lg font-semibold text-gray-600 dark:text-gray-400">No Charging History</p>
          <p class="text-sm text-gray-500 dark:text-gray-500 mt-1">Complete a charging session to see analytics here</p>
        </div>
      }
    </div>
  `,
  styles: []
})
export class AnalyticsComponent implements OnInit {
  private mockDataService = inject(MockDataService);

  sessions = signal<ChargingSession[]>([]);

  analytics = computed(() => {
    const sessionList = this.sessions();

    if (sessionList.length === 0) {
      return {
        totalEnergy: 0,
        totalSpent: 0,
        avgPerSession: 0
      };
    }

    const totalEnergy = sessionList.reduce((sum, session) => sum + session.energy, 0);
    const totalSpent = sessionList.reduce((sum, session) => sum + session.cost, 0);
    const avgPerSession = totalEnergy / sessionList.length;

    return {
      totalEnergy,
      totalSpent,
      avgPerSession
    };
  });

  chartData = computed(() => {
    return this.sessions().map(session => ({
      label: `${session.stationName} - ${this.formatDate(session.date)}`,
      value: session.energy
    }));
  });

  ngOnInit() {
    this.loadSessions();
  }

  loadSessions() {
    const sessions = this.mockDataService.getChargingSessions();
    this.sessions.set(sessions);
  }

  getBarWidth(value: number): number {
    const maxValue = Math.max(...this.sessions().map(s => s.energy), 1);
    return (value / maxValue) * 100;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
