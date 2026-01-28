import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockDataService } from '../../core/services/mock-data.service';
import { signal, computed } from '@angular/core';

interface ActiveSession {
  id: string;
  stationName: string;
  chargerId: string;
  energyDelivered: number;
  totalCost: number;
  chargingRate: number;
  startTime: Date;
  pricePerKwh: number;
  socPercent: number;
}

@Component({
  selector: 'app-active-session',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full h-full bg-white dark:bg-slate-950 p-6 rounded-lg shadow-md">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Active Charging Session</h2>

      @if (currentSession(); as session) {
        <div class="space-y-6">
          <!-- Session Overview Cards -->
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Energy Delivered</p>
              <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">{{ formatEnergy(session.energyDelivered) }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">kWh</p>
            </div>
            <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Cost</p>
              <p class="text-3xl font-bold text-green-600 dark:text-green-400">{{ formatCurrency(session.totalCost) }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">USD</p>
            </div>
          </div>

          <!-- SoC Progress Bar -->
          <div class="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4">
            <div class="flex justify-between items-center mb-2">
              <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">State of Charge</p>
              <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ session.socPercent }}%</p>
            </div>
            <div class="w-full bg-gray-300 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
              <div
                class="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 ease-out"
                [style.width.%]="session.socPercent">
              </div>
            </div>
          </div>

          <!-- Session Details -->
          <div class="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Session Details</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wide">Station Name</p>
                <p class="text-base font-semibold text-gray-900 dark:text-white mt-1">{{ session.stationName }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wide">Charger ID</p>
                <p class="text-base font-semibold text-gray-900 dark:text-white mt-1">{{ session.chargerId }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wide">Charging Rate</p>
                <p class="text-base font-semibold text-gray-900 dark:text-white mt-1">{{ session.chargingRate }} kW</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wide">Start Time</p>
                <p class="text-base font-semibold text-gray-900 dark:text-white mt-1">{{ formatTime(session.startTime) }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wide">Price per kWh</p>
                <p class="text-base font-semibold text-gray-900 dark:text-white mt-1">{{ formatCurrency(session.pricePerKwh) }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wide">Session Duration</p>
                <p class="text-base font-semibold text-gray-900 dark:text-white mt-1">{{ formatDuration() }}</p>
              </div>
            </div>
          </div>

          <!-- Stop Charging Button -->
          <button
            (click)="stopCharging()"
            class="w-full bg-red-600 dark:bg-red-600 hover:bg-red-700 dark:hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 ease-in-out">
            Stop Charging
          </button>
        </div>
      } @else {
        <div class="flex flex-col items-center justify-center h-64">
          <svg class="w-16 h-16 text-gray-300 dark:text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
          <p class="text-lg font-semibold text-gray-600 dark:text-gray-400">No Active Session</p>
          <p class="text-sm text-gray-500 dark:text-gray-500 mt-1">Start charging to see session details here</p>
        </div>
      }
    </div>
  `,
  styles: []
})
export class ActiveSessionComponent implements OnInit {
  private mockDataService = inject(MockDataService);
  currentSession = signal<ActiveSession | null>(null);

  ngOnInit() {
    this.loadActiveSession();
  }

  loadActiveSession() {
    const session = this.mockDataService.getActiveSession();
    this.currentSession.set(session);
  }

  formatEnergy(kwh: number): string {
    return kwh.toFixed(2);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date(date));
  }

  formatDuration(): string {
    const session = this.currentSession();
    if (!session) return '0m';

    const now = new Date();
    const startTime = new Date(session.startTime);
    const diffMs = now.getTime() - startTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  stopCharging() {
    this.mockDataService.stopSession();
    this.currentSession.set(null);
  }
}
