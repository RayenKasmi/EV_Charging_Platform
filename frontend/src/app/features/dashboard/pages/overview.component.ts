import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent, SpinnerComponent } from '../../../shared/components';
import { AuthService } from '../../../core/services/auth.service';
import { DummyDataService } from '../../../core/services/dummy-data.service';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, CardComponent, SpinnerComponent],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div>
        <h2 class="text-4xl font-bold bg-gradient-to-r from-slate-900 to-primary-900 bg-clip-text text-transparent">Hello, {{ currentUser()?.firstName }}! 👋</h2>
        <p class="text-slate-600 mt-2 text-lg">Here's what's happening with your EV charging network today</p>
      </div>

      <!-- Role-based content -->
      <div *ngIf="currentUser()?.role === 'OPERATOR'">
        <ng-container *ngTemplateOutlet="operatorDashboard"></ng-container>
      </div>
      <div *ngIf="currentUser()?.role === 'DRIVER'">
        <ng-container *ngTemplateOutlet="driverDashboard"></ng-container>
      </div>
      <div *ngIf="currentUser()?.role === 'ADMIN'">
        <ng-container *ngTemplateOutlet="adminDashboard"></ng-container>
      </div>
    </div>

    <!-- Operator Dashboard Template -->
    <ng-template #operatorDashboard>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <!-- Revenue Card -->
        <div class="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-6 border border-primary-200 shadow-sm hover:shadow-lg transition-shadow duration-300">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-primary-200 rounded-xl flex items-center justify-center">
              <span class="text-2xl">💰</span>
            </div>
            <span class="text-xs font-bold text-secondary-600 bg-secondary-100 px-3 py-1 rounded-full">+12.5%</span>
          </div>
          <p class="text-primary-600 text-sm font-semibold">Today's Revenue</p>
          <p class="text-3xl font-bold text-primary-900 mt-3">$2,450</p>
          <p class="text-primary-600 text-xs mt-3">↑ from yesterday</p>
        </div>

        <!-- Sessions Card -->
        <div class="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-2xl p-6 border border-secondary-200 shadow-sm hover:shadow-lg transition-shadow duration-300">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-secondary-200 rounded-xl flex items-center justify-center">
              <span class="text-2xl">⚡</span>
            </div>
            <span class="status-dot status-active animate-pulse"></span>
          </div>
          <p class="text-secondary-600 text-sm font-semibold">Active Sessions</p>
          <p class="text-3xl font-bold text-secondary-900 mt-3">15</p>
          <p class="text-secondary-600 text-xs mt-3">across 3 stations</p>
        </div>

        <!-- Chargers Card -->
        <div class="bg-gradient-to-br from-accent-50 to-accent-100 rounded-2xl p-6 border border-accent-200 shadow-sm hover:shadow-lg transition-shadow duration-300">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-accent-200 rounded-xl flex items-center justify-center">
              <span class="text-2xl">🔌</span>
            </div>
            <span class="text-xs font-bold text-accent-600 bg-accent-200 px-3 py-1 rounded-full">48%</span>
          </div>
          <p class="text-accent-600 text-sm font-semibold">Chargers Available</p>
          <p class="text-3xl font-bold text-accent-900 mt-3">23/48</p>
          <p class="text-accent-600 text-xs mt-3">utilization rate</p>
        </div>

        <!-- Reservations Card -->
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 shadow-sm hover:shadow-lg transition-shadow duration-300">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center">
              <span class="text-2xl">📅</span>
            </div>
            <span class="text-xs font-bold text-blue-600 bg-blue-200 px-3 py-1 rounded-full">6/8</span>
          </div>
          <p class="text-blue-600 text-sm font-semibold">Reservations Today</p>
          <p class="text-3xl font-bold text-blue-900 mt-3">8</p>
          <p class="text-blue-600 text-xs mt-3">confirmed bookings</p>
        </div>
      </div>

      <!-- Tip Box -->
      <div class="bg-gradient-to-r from-primary-50 via-white to-secondary-50 border border-primary-200 rounded-2xl p-6 shadow-sm">
        <div class="flex gap-4">
          <span class="text-3xl">💡</span>
          <div>
            <p class="font-bold text-slate-900">Pro Tip</p>
            <p class="text-slate-600 text-sm mt-1">Navigate to your stations, pricing management, or analytics using the sidebar menu to view detailed information and make real-time updates.</p>
          </div>
        </div>
      </div>
    </ng-template>

    <!-- Driver Dashboard Template -->
    <ng-template #driverDashboard>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Battery Card -->
        <div class="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-2xl p-8 border border-secondary-200 shadow-sm hover:shadow-lg transition-shadow duration-300">
          <div class="flex items-center justify-between mb-6">
            <div class="w-14 h-14 bg-secondary-200 rounded-xl flex items-center justify-center">
              <span class="text-3xl">🔋</span>
            </div>
          </div>
          <p class="text-secondary-600 text-sm font-semibold">Current Battery</p>
          <p class="text-4xl font-bold text-secondary-900 mt-4">82%</p>
          <div class="bg-secondary-300 rounded-full h-3 mt-5 overflow-hidden">
            <div class="bg-gradient-to-r from-secondary-400 to-secondary-600 h-3 rounded-full transition-all duration-500" style="width: 82%"></div>
          </div>
          <p class="text-secondary-600 text-xs mt-4">Estimated range: 240 miles</p>
        </div>

        <!-- Reservations Card -->
        <div class="bg-gradient-to-br from-accent-50 to-accent-100 rounded-2xl p-8 border border-accent-200 shadow-sm hover:shadow-lg transition-shadow duration-300">
          <div class="flex items-center justify-between mb-6">
            <div class="w-14 h-14 bg-accent-200 rounded-xl flex items-center justify-center">
              <span class="text-3xl">📅</span>
            </div>
            <span class="status-dot status-active"></span>
          </div>
          <p class="text-accent-600 text-sm font-semibold">Upcoming Reservations</p>
          <p class="text-4xl font-bold text-accent-900 mt-4">5</p>
          <p class="text-accent-600 text-xs mt-4">Next one in 2 days</p>
        </div>

        <!-- Spending Card -->
        <div class="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-8 border border-primary-200 shadow-sm hover:shadow-lg transition-shadow duration-300">
          <div class="flex items-center justify-between mb-6">
            <div class="w-14 h-14 bg-primary-200 rounded-xl flex items-center justify-center">
              <span class="text-3xl">💳</span>
            </div>
            <span class="text-xs font-bold text-primary-600 bg-primary-200 px-3 py-1 rounded-full">This Month</span>
          </div>
          <p class="text-primary-600 text-sm font-semibold">Total Spent</p>
          <p class="text-4xl font-bold text-primary-900 mt-4">$125.50</p>
          <p class="text-primary-600 text-xs mt-4">142 kWh charged</p>
        </div>
      </div>

      <!-- Tip Box -->
      <div class="bg-gradient-to-r from-secondary-50 via-white to-primary-50 border border-secondary-200 rounded-2xl p-6 shadow-sm">
        <div class="flex gap-4">
          <span class="text-3xl">⚡</span>
          <div>
            <p class="font-bold text-slate-900">Ready to Charge?</p>
            <p class="text-slate-600 text-sm mt-1">Use the "Find Stations" menu to locate nearby EV charging stations, or check your upcoming reservations to manage your charging schedule.</p>
          </div>
        </div>
      </div>
    </ng-template>

    <!-- Admin Dashboard Template -->
    <ng-template #adminDashboard>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <!-- Total Stations -->
        <div class="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-6 border border-primary-200 shadow-sm hover:shadow-lg transition-shadow duration-300">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-primary-200 rounded-xl flex items-center justify-center">
              <span class="text-2xl">🏢</span>
            </div>
            <span class="text-xs font-bold text-secondary-600 bg-secondary-100 px-3 py-1 rounded-full">45 Active</span>
          </div>
          <p class="text-primary-600 text-sm font-semibold">Total Stations</p>
          <p class="text-3xl font-bold text-primary-900 mt-3">47</p>
          <p class="text-primary-600 text-xs mt-3">platform-wide</p>
        </div>

        <!-- Platform Revenue -->
        <div class="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-2xl p-6 border border-secondary-200 shadow-sm hover:shadow-lg transition-shadow duration-300">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-secondary-200 rounded-xl flex items-center justify-center">
              <span class="text-2xl">💰</span>
            </div>
            <span class="text-xs font-bold text-secondary-600 bg-secondary-200 px-3 py-1 rounded-full">+23%</span>
          </div>
          <p class="text-secondary-600 text-sm font-semibold">Platform Revenue</p>
          <p class="text-3xl font-bold text-secondary-900 mt-3">$12.5K</p>
          <p class="text-secondary-600 text-xs mt-3">this month</p>
        </div>

        <!-- Active Users -->
        <div class="bg-gradient-to-br from-accent-50 to-accent-100 rounded-2xl p-6 border border-accent-200 shadow-sm hover:shadow-lg transition-shadow duration-300">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-accent-200 rounded-xl flex items-center justify-center">
              <span class="text-2xl">👥</span>
            </div>
            <span class="text-xs font-bold text-accent-600 bg-accent-200 px-3 py-1 rounded-full">+45</span>
          </div>
          <p class="text-accent-600 text-sm font-semibold">Active Users</p>
          <p class="text-3xl font-bold text-accent-900 mt-3">287</p>
          <p class="text-accent-600 text-xs mt-3">this week</p>
        </div>

        <!-- Sessions Today -->
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 shadow-sm hover:shadow-lg transition-shadow duration-300">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center">
              <span class="text-2xl">⚡</span>
            </div>
            <span class="status-dot status-active animate-pulse"></span>
          </div>
          <p class="text-blue-600 text-sm font-semibold">Sessions Today</p>
          <p class="text-3xl font-bold text-blue-900 mt-3">156</p>
          <p class="text-blue-600 text-xs mt-3">2,450 kWh delivered</p>
        </div>
      </div>

      <!-- Admin Tip Box -->
      <div class="bg-gradient-to-r from-primary-50 via-white to-accent-50 border border-primary-200 rounded-2xl p-6 shadow-sm">
        <div class="flex gap-4">
          <span class="text-3xl">📊</span>
          <div>
            <p class="font-bold text-slate-900">Admin Controls</p>
            <p class="text-slate-600 text-sm mt-1">Use the sidebar to manage all stations, view detailed analytics, configure pricing globally, and access comprehensive system settings and reports.</p>
          </div>
        </div>
      </div>
    </ng-template>
  `,
})
export class OverviewComponent {
  authService = inject(AuthService);
  dummyDataService = inject(DummyDataService);

  currentUser = this.authService.currentUser;
}
