import { Routes } from '@angular/router';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <h2 class="text-2xl font-bold text-gray-900">Analytics</h2>
      <div class="bg-white rounded-lg shadow-md overflow-hidden p-6">
        <p class="text-gray-600">Revenue, utilization, and user behavior analytics coming soon...</p>
      </div>
    </div>
  `,
})
class AnalyticsComponent {}

export const ANALYTICS_ROUTES: Routes = [
  {
    path: '',
    component: AnalyticsComponent,
  },
];
