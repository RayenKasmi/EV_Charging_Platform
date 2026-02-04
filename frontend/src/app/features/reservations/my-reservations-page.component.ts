import { Component, signal, computed, inject, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Reservation, ReservationStatus } from '@core/models/reservation.model';
import { ReservationService } from '@core/services/reservation.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-my-reservations-page',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './my-reservations-page.component.html'
})
export class MyReservationsPageComponent implements OnInit, OnDestroy {
  private reservationService = inject(ReservationService);

  // Get reservations and loading state directly from service
  isLoading = this.reservationService.isLoadingReservations;
  
  selectedTab = signal<string>('upcoming');
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
    switch (this.selectedTab()) {
      case 'upcoming':
        return this.reservationService.upcomingReservations();
      case 'active':
        return this.reservationService.activeReservations();
      case 'past':
        return this.reservationService.pastReservations();
      case 'cancelled':
        return this.reservationService.cancelledReservations();
      default:
        return [];
    }
  });

  ngOnInit() {
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

  refreshReservations() {
    this.reservationService.refreshReservations();
  }

  selectTab(tabId: string) {
    this.selectedTab.set(tabId);
  }

  getCountForStatus(statuses: ReservationStatus[]): number {
    if (statuses.includes('PENDING') || statuses.includes('CONFIRMED')) {
      return this.reservationService.upcomingReservations().length;
    }

    if (statuses.includes('ACTIVE')) {
      return this.reservationService.activeReservations().length;
    }

    if (statuses.includes('COMPLETED') || statuses.includes('EXPIRED')) {
      return this.reservationService.pastReservations().length;
    }

    if (statuses.includes('CANCELLED')) {
      return this.reservationService.cancelledReservations().length;
    }

    return 0;
  }

  cancelReservation(id: string) {
    this.isCancelling.set(id);

    this.reservationService.cancelReservation(id).subscribe({
      next: () => {
        this.isCancelling.set('');
        // Reservations will automatically update via the resource
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
