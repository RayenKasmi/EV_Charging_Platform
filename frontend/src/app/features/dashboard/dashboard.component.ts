import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-8 text-white">
        <h1 class="text-3xl font-bold mb-2">
          Welcome, {{ authService.currentUser()?.name }}!
        </h1>
        <p class="text-blue-100">
          Your EV Charging Platform Dashboard
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-gray-600 font-medium">Active Sessions</h3>
            <span class="text-2xl">🔋</span>
          </div>
          <p class="text-3xl font-bold text-gray-800">0</p>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-gray-600 font-medium">Total Stations</h3>
            <span class="text-2xl">⚡</span>
          </div>
          <p class="text-3xl font-bold text-gray-800">0</p>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-gray-600 font-medium">Reservations</h3>
            <span class="text-2xl">📅</span>
          </div>
          <p class="text-3xl font-bold text-gray-800">0</p>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-gray-600 font-medium">Energy Used</h3>
            <span class="text-2xl">📊</span>
          </div>
          <p class="text-3xl font-bold text-gray-800">0 kWh</p>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button class="px-6 py-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium">
            Find Charging Station
          </button>
          <button class="px-6 py-4 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors font-medium">
            Start Charging Session
          </button>
          <button class="px-6 py-4 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors font-medium">
            View Analytics
          </button>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent {
  authService = inject(AuthService);
}
