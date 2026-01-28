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
    <div class="flex h-screen bg-slate-100">
      <!-- Sidebar -->
      <div class="w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col shadow-2xl border-r border-slate-700">
        <!-- Logo -->
        <div class="px-6 py-8 border-b border-slate-700">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 bg-gradient-to-br from-primary-400 to-accent-500 rounded-lg flex items-center justify-center">
              <span class="text-xl">⚡</span>
            </div>
            <div>
              <h2 class="text-xl font-bold">EV Charge</h2>
              <p class="text-xs text-slate-400">Platform</p>
            </div>
          </div>
        </div>

        <!-- User Info Card -->
        <div class="mx-4 mt-6 mb-6 p-4 bg-gradient-to-br from-primary-900 to-primary-800 rounded-xl border border-primary-700">
          <p class="text-xs text-primary-300 uppercase tracking-wide mb-2">User Profile</p>
          <p class="font-semibold text-white">{{ currentUser()?.firstName }} {{ currentUser()?.lastName }}</p>
          <div class="flex items-center gap-2 mt-3">
            <span class="w-2 h-2 bg-secondary-400 rounded-full"></span>
            <span class="text-xs font-medium text-primary-100">{{ currentUser()?.role }}</span>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-3 space-y-1 overflow-y-auto">
          <a
            *ngFor="let item of getVisibleNavItems()"
            [routerLink]="item.route"
            routerLinkActive="bg-primary-600 text-white shadow-lg"
            [routerLinkActiveOptions]="{ exact: false }"
            class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-slate-700 text-slate-300 group"
          >
            <span class="text-lg group-hover:scale-110 transition-transform">{{ item.icon }}</span>
            <span class="font-medium">{{ item.label }}</span>
          </a>
        </nav>

        <!-- Logout Button -->
        <div class="px-3 py-6 border-t border-slate-700">
          <button
            (click)="onLogout()"
            class="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <span>🚪</span>
            Logout
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Top Navbar -->
        <div class="bg-white border-b border-slate-200 shadow-sm px-8 py-5 flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">Dashboard</h1>
            <p class="text-sm text-slate-500 mt-1">Welcome back to your charging platform</p>
          </div>
          <div class="flex items-center gap-6">
            <div class="hidden md:block text-right">
              <p class="text-sm font-medium text-slate-900">{{ currentUser()?.firstName }}</p>
              <p class="text-xs text-slate-500">{{ currentUser()?.email }}</p>
            </div>
            <a
              routerLink="/dashboard/profile"
              class="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-bold text-lg hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer"
            >
              {{ getUserInitials() }}
            </a>
          </div>
        </div>

        <!-- Page Content -->
        <div class="flex-1 overflow-auto p-8">
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
