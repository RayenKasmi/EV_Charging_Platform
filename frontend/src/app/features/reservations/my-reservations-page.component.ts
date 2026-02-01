import { Component, signal, computed, inject, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Reservation, ReservationStatus } from '../../core/models/reservation.model';
import { ReservationService } from '../../core/services/reservation.service';
import { interval, Subscription } from 'rxjs';

interface CountdownTimer {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

@Component({
  selector: 'app-my-reservations-page',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-800 dark:text-white">My Reservations</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">Manage your charging station reservations</p>
        </div>

        <button
          (click)="refreshReservations()"
          [disabled]="isLoading()"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2">
          @if (isLoading()) {
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          } @else {
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          }
          Refresh
        </button>
      </div>

      <div class="bg-white dark:bg-slate-800 rounded-lg shadow">
        <div class="border-b border-gray-200 dark:border-slate-700">
          <nav class="flex -mb-px">
            @for (tab of tabs; track tab.id) {
              <button
                (click)="selectTab(tab.id)"
                [class.border-blue-600]="selectedTab() === tab.id"
                [class.text-blue-600]="selectedTab() === tab.id"
                [class.dark:text-blue-400]="selectedTab() === tab.id"
                [class.border-transparent]="selectedTab() !== tab.id"
                [class.text-gray-500]="selectedTab() !== tab.id"
                [class.dark:text-gray-400]="selectedTab() !== tab.id"
                class="px-6 py-4 border-b-2 font-medium text-sm transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                {{ tab.label }}
                @if (getCountForStatus(tab.statuses) > 0) {
                  <span class="ml-2 px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-full text-xs">
                    {{ getCountForStatus(tab.statuses) }}
                  </span>
                }
              </button>
            }
          </nav>
        </div>

        <div class="p-6">
          @if (isLoading()) {
            <div class="flex justify-center items-center py-12">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          } @else if (errorMessage()) {
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p class="text-red-700 dark:text-red-400">{{ errorMessage() }}</p>
            </div>
          } @else if (filteredReservations().length === 0) {
            <div class="flex flex-col items-center justify-center py-12">
              <svg class="w-16 h-16 text-gray-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <p class="text-gray-600 dark:text-gray-400 font-medium">No {{ selectedTab() }} reservations</p>
            </div>
          } @else {
            <div class="space-y-4">
              @for (reservation of filteredReservations(); track reservation.id) {
                <div class="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center gap-3 mb-2">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                          {{ reservation.stationName }}
                        </h3>
                        <span [ngClass]="getStatusBadgeClass(reservation.status)" class="px-3 py-1 rounded-full text-xs font-semibold">
                          {{ reservation.status }}
                        </span>
                      </div>

                      <div class="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Charger Type</p>
                          <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">{{ reservation.chargerType }}</p>
                        </div>
                        <div>
                          <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date</p>
                          <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">{{ formatDate(reservation.startTime) }}</p>
                        </div>
                        <div>
                          <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Time</p>
                          <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">
                            {{ formatTime(reservation.startTime) }} - {{ formatTime(reservation.endTime) }}
                          </p>
                        </div>
                        <div>
                          <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Estimated Cost</p>
                          <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">{{ formatCurrency(reservation.estimatedCost) }}</p>
                        </div>
                      </div>

                      @if (reservation.status === 'CONFIRMED' || reservation.status === 'PENDING') {
                        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-3">
                          <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Starts in</p>
                          <p class="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {{ getCountdown(reservation.startTime) }}
                          </p>
                        </div>
                      }
                    </div>

                    <div class="flex flex-col gap-2 ml-4">
                      @if (reservation.status === 'CONFIRMED' || reservation.status === 'PENDING') {
                        <button
                          (click)="navigateToStation(reservation.stationId)"
                          class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                          </svg>
                          Navigate
                        </button>
                        <button
                          (click)="cancelReservation(reservation.id)"
                          [disabled]="isCancelling() === reservation.id"
                          class="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 justify-center">
                          @if (isCancelling() === reservation.id) {
                            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          } @else {
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          }
                          Cancel
                        </button>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class MyReservationsPageComponent implements OnInit, OnDestroy {
  private reservationService = inject(ReservationService);

  reservations = signal<Reservation[]>([]);
  selectedTab = signal<string>('upcoming');
  isLoading = signal(false);
  errorMessage = signal<string>('');
  isCancelling = signal<string>('');
  currentTime = signal<Date>(new Date());

  private timerSubscription?: Subscription;

  tabs = [
    { id: 'upcoming', label: 'Upcoming', statuses: ['PENDING', 'CONFIRMED'] as ReservationStatus[] },
    { id: 'active', label: 'Active', statuses: ['ACTIVE'] as ReservationStatus[] },
    { id: 'past', label: 'Past', statuses: ['COMPLETED'] as ReservationStatus[] },
    { id: 'cancelled', label: 'Cancelled', statuses: ['CANCELLED'] as ReservationStatus[] }
  ];

  filteredReservations = computed(() => {
    const tab = this.tabs.find(t => t.id === this.selectedTab());
    if (!tab) return [];

    return this.reservations()
      .filter(r => tab.statuses.includes(r.status))
      .sort((a, b) => {
        if (this.selectedTab() === 'past') {
          return b.startTime.getTime() - a.startTime.getTime();
        }
        return a.startTime.getTime() - b.startTime.getTime();
      });
  });

  ngOnInit() {
    this.loadReservations();
    this.startCountdownTimer();
  }

  ngOnDestroy() {
    this.stopCountdownTimer();
  }

  private startCountdownTimer() {
    this.timerSubscription = interval(1000).subscribe(() => {
      this.currentTime.set(new Date());
    });
  }

  private stopCountdownTimer() {
    this.timerSubscription?.unsubscribe();
  }

  loadReservations() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.reservationService.getReservations('1').subscribe({
      next: (reservations) => {
        this.reservations.set(reservations);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Failed to load reservations');
        this.isLoading.set(false);
      }
    });
  }

  refreshReservations() {
    this.loadReservations();
  }

  selectTab(tabId: string) {
    this.selectedTab.set(tabId);
  }

  getCountForStatus(statuses: ReservationStatus[]): number {
    return this.reservations().filter(r => statuses.includes(r.status)).length;
  }

  cancelReservation(id: string) {
    this.isCancelling.set(id);

    this.reservationService.cancelReservation(id).subscribe({
      next: () => {
        this.isCancelling.set('');
        this.loadReservations();
      },
      error: (error) => {
        this.isCancelling.set('');
        this.errorMessage.set(error.message || 'Failed to cancel reservation');
      }
    });
  }

  navigateToStation(stationId: string) {
    console.log('Navigate to station:', stationId);
  }

  getCountdown(startTime: Date): string {
    const now = this.currentTime();
    const diff = startTime.getTime() - now.getTime();

    if (diff <= 0) {
      return 'Starting soon';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  getStatusBadgeClass(status: ReservationStatus): string {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  formatTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}
