import { Routes } from '@angular/router';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <h2 class="text-2xl font-bold text-gray-900">Reservations</h2>
      <div class="bg-white rounded-lg shadow-md overflow-hidden p-6">
        <p class="text-gray-600">Reservation calendar and management coming soon...</p>
      </div>
    </div>
  `,
})
class ReservationsComponent {}

export const RESERVATIONS_ROUTES: Routes = [
  {
    path: '',
    component: ReservationsComponent,
  },
];
