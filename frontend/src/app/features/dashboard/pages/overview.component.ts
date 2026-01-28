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
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-gray-600 mt-2">Welcome back, {{ currentUser()?.firstName }}!</p>
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
        <app-card>
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">$2,450</div>
            <p class="text-gray-600 text-sm mt-2">Today's Revenue</p>
            <p class="text-green-600 text-xs mt-1">📈 +12.5% from yesterday</p>
          </div>
        </app-card>

        <app-card>
          <div class="text-center">
            <div class="text-3xl font-bold text-green-600">15</div>
            <p class="text-gray-600 text-sm mt-2">Active Sessions</p>
            <p class="text-blue-600 text-xs mt-1">Across 3 stations</p>
          </div>
        </app-card>

        <app-card>
          <div class="text-center">
            <div class="text-3xl font-bold text-orange-600">23/48</div>
            <p class="text-gray-600 text-sm mt-2">Chargers Available</p>
            <p class="text-gray-600 text-xs mt-1">47.9% utilization</p>
          </div>
        </app-card>

        <app-card>
          <div class="text-center">
            <div class="text-3xl font-bold text-purple-600">8</div>
            <p class="text-gray-600 text-sm mt-2">Reservations Today</p>
            <p class="text-blue-600 text-xs mt-1">6 confirmed</p>
          </div>
        </app-card>
      </div>

      <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p class="text-blue-800">
          💡 <strong>Tip:</strong> Navigate to your stations, pricing management, or analytics using the sidebar menu to view detailed information.
        </p>
      </div>
    </ng-template>

    <!-- Driver Dashboard Template -->
    <ng-template #driverDashboard>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <app-card>
          <div class="text-center">
            <div class="text-3xl font-bold text-green-600">82%</div>
            <p class="text-gray-600 text-sm mt-2">Current Battery Level</p>
            <div class="bg-gray-200 rounded-full h-3 mt-3">
              <div class="bg-green-600 h-3 rounded-full" style="width: 82%"></div>
            </div>
          </div>
        </app-card>

        <app-card>
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">5</div>
            <p class="text-gray-600 text-sm mt-2">Upcoming Reservations</p>
            <p class="text-blue-600 text-xs mt-1">Next one in 2 days</p>
          </div>
        </app-card>

        <app-card>
          <div class="text-center">
            <div class="text-3xl font-bold text-purple-600">$125.50</div>
            <p class="text-gray-600 text-sm mt-2">Total Spent This Month</p>
            <p class="text-gray-600 text-xs mt-1">142 kWh charged</p>
          </div>
        </app-card>
      </div>

      <div class="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <p class="text-green-800">
          🔋 <strong>Ready to charge?</strong> Use the "Find Stations" menu to locate nearby EV charging stations, or check your reservations!
        </p>
      </div>
    </ng-template>

    <!-- Admin Dashboard Template -->
    <ng-template #adminDashboard>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <app-card>
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">47</div>
            <p class="text-gray-600 text-sm mt-2">Total Stations</p>
            <p class="text-green-600 text-xs mt-1">45 active</p>
          </div>
        </app-card>

        <app-card>
          <div class="text-center">
            <div class="text-3xl font-bold text-green-600">$12.5K</div>
            <p class="text-gray-600 text-sm mt-2">Platform Revenue</p>
            <p class="text-green-600 text-xs mt-1">📈 +23% this month</p>
          </div>
        </app-card>

        <app-card>
          <div class="text-center">
            <div class="text-3xl font-bold text-purple-600">287</div>
            <p class="text-gray-600 text-sm mt-2">Active Users</p>
            <p class="text-blue-600 text-xs mt-1">+45 this week</p>
          </div>
        </app-card>

        <app-card>
          <div class="text-center">
            <div class="text-3xl font-bold text-orange-600">156</div>
            <p class="text-gray-600 text-sm mt-2">Sessions Today</p>
            <p class="text-blue-600 text-xs mt-1">2,450 kWh delivered</p>
          </div>
        </app-card>
      </div>

      <div class="mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <p class="text-indigo-800">
          📊 <strong>Admin Access:</strong> Use the sidebar to manage all stations, view analytics, manage pricing globally, and access system settings.
        </p>
      </div>
    </ng-template>
  `,
})
export class OverviewComponent {
  authService = inject(AuthService);
  dummyDataService = inject(DummyDataService);

  currentUser = this.authService.currentUser;
}
