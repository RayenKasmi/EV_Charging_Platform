import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="bg-white dark:bg-slate-900 shadow-sm border-b dark:border-slate-700 sticky top-0 z-10 transition-colors">
      <div class="px-6 py-4 flex items-center justify-between">
        <div class="flex-1">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-white">{{ pageTitle() }}</h2>
        </div>

        <div class="flex items-center gap-4">
          <button class="relative p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-600 dark:text-gray-400">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <button
            (click)="toggleTheme()"
            class="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-600 dark:text-gray-400"
          >
            @if (themeService.isDarkMode()) {
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
            } @else {
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 a 1 1 0 011 1v1a8 8 0 11-16 0 8 8 0 0116 0v-1a1 1 0 11-2 0v-1a6 6 0 00-6-6 6 6 0 00-6 6 6 6 0 006 6 1 1 0 110 2 8 8 0 01-8-8 8 8 0 018-8z" clip-rule="evenodd"></path></svg>
            }
          </button>

          <div class="relative">
            <button
              (click)="toggleDropdown()"
              class="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {{ getUserInitials() }}
              </div>
              <span class="font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">{{ authService.currentUser()?.name }}</span>
              <svg class="w-4 h-4 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
            </button>

            @if (isDropdownOpen()) {
              <div class="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border dark:border-slate-700 py-2 transition-colors">
                <button
                  (click)="logout()"
                  class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-300"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                  Logout
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  private router = inject(Router);

  pageTitle = signal('Dashboard');
  isDropdownOpen = signal(false);

  toggleDropdown(): void {
    this.isDropdownOpen.update(value => !value);
  }

  toggleTheme(): void {
    this.themeService.toggleDarkMode();
  }

  getUserInitials(): string {
    const name = this.authService.currentUser()?.name || '';
    return name.charAt(0).toUpperCase();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
