import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ButtonComponent } from '../../../shared/components/button.component';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, ButtonComponent],
  template: `
    <div class="flex h-screen bg-gray-100">
      <!-- Sidebar -->
      <div class="w-64 bg-gray-900 text-white flex flex-col shadow-lg">
        <!-- Logo -->
        <div class="px-6 py-6 border-b border-gray-800">
          <h2 class="text-2xl font-bold">⚡ EV Charging</h2>
          <p class="text-gray-400 text-sm mt-1">Platform</p>
        </div>

        <!-- User Info -->
        <div class="px-6 py-4 border-b border-gray-800 bg-gray-800">
          <p class="text-sm text-gray-400">Logged in as</p>
          <p class="font-semibold">{{ currentUser()?.firstName }} {{ currentUser()?.lastName }}</p>
          <span class="text-xs bg-blue-600 text-white px-2 py-1 rounded mt-2 inline-block">
            {{ currentUser()?.role }}
          </span>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <a
            *ngFor="let item of getVisibleNavItems()"
            [routerLink]="item.route"
            routerLinkActive="bg-gray-700"
            [routerLinkActiveOptions]="{ exact: false }"
            class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-gray-800 text-gray-300"
          >
            <span class="text-xl">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </a>
        </nav>

        <!-- Logout -->
        <div class="px-4 py-4 border-t border-gray-800">
          <button
            (click)="onLogout()"
            class="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Top Navbar -->
        <div class="bg-white shadow px-6 py-4 flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div class="flex items-center gap-4">
            <span class="text-gray-600">Welcome back!</span>
            <a
              routerLink="/dashboard/profile"
              class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg hover:shadow-lg transition-shadow"
            >
              {{ getUserInitials() }}
            </a>
          </div>
        </div>

        <!-- Page Content -->
        <div class="flex-1 overflow-auto p-6">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
})
export class DashboardLayoutComponent implements OnInit {
  authService = inject(AuthService);

  currentUser = this.authService.currentUser;

  private navItems: NavItem[] = [
    { label: 'Dashboard', icon: '🏠', route: '/dashboard/overview' },
    { label: 'Find Stations', icon: '🗺️', route: '/dashboard/stations', roles: ['DRIVER'] },
    { label: 'My Stations', icon: '🏭', route: '/dashboard/stations', roles: ['OPERATOR', 'ADMIN'] },
    { label: 'Reservations', icon: '📅', route: '/dashboard/reservations' },
    { label: 'Active Session', icon: '⚡', route: '/dashboard/sessions/active' },
    { label: 'Session History', icon: '📊', route: '/dashboard/sessions/history' },
    { label: 'Pricing', icon: '💰', route: '/dashboard/pricing', roles: ['OPERATOR', 'ADMIN'] },
    { label: 'Queue Management', icon: '📋', route: '/dashboard/queue', roles: ['OPERATOR', 'ADMIN'] },
    { label: 'Analytics', icon: '📈', route: '/dashboard/analytics', roles: ['OPERATOR', 'ADMIN'] },
    { label: 'Profile', icon: '👤', route: '/dashboard/profile' },
  ];

  ngOnInit(): void {}

  getVisibleNavItems(): NavItem[] {
    const userRole = this.authService.userRole();
    return this.navItems.filter((item) => {
      if (!item.roles) return true;
      return item.roles.includes(userRole || '');
    });
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return '';
    return (user.firstName[0] + user.lastName[0]).toUpperCase();
  }

  onLogout(): void {
    this.authService.logout();
  }
}
