import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockDataService } from '@core/services/mock-data.service';
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
  templateUrl: './analytics.component.html',
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
