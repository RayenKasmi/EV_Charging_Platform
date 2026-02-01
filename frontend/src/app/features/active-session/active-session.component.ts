import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockDataService } from '@core/services/mock-data.service';
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
  templateUrl: './active-session.component.html',
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
