import { Routes } from '@angular/router';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <h2 class="text-2xl font-bold text-gray-900">Charging Sessions</h2>
      <div class="bg-white rounded-lg shadow-md overflow-hidden p-6">
        <p class="text-gray-600">Session monitoring and history coming soon...</p>
      </div>
    </div>
  `,
})
class SessionsComponent {}

export const SESSIONS_ROUTES: Routes = [
  {
    path: '',
    component: SessionsComponent,
  },
];
