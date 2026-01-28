import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../../shared/components';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, CardComponent],
  template: `
    <div class="max-w-3xl">
      <!-- Header -->
      <div class="mb-8">
        <h2 class="text-4xl font-bold bg-gradient-to-r from-slate-900 to-primary-900 bg-clip-text text-transparent">My Profile 👤</h2>
        <p class="text-slate-600 mt-2 text-lg">Manage your account information and preferences</p>
      </div>

      <!-- Profile Card -->
      <div class="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
        <!-- Header Section -->
        <div class="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 px-8 py-12">
          <div class="flex items-center gap-6">
            <div class="w-20 h-20 bg-white shadow-lg rounded-full flex items-center justify-center text-primary-600 text-3xl font-bold ring-4 ring-primary-300">
              {{ getUserInitials() }}
            </div>
            <div class="text-white">
              <h3 class="text-3xl font-bold">{{ currentUser()?.firstName }} {{ currentUser()?.lastName }}</h3>
              <p class="text-primary-100 mt-1">{{ currentUser()?.email }}</p>
              <div class="mt-3">
                <span class="inline-block px-4 py-1 bg-white bg-opacity-20 text-white rounded-full text-sm font-semibold backdrop-blur-sm">
                  {{ currentUser()?.role | titlecase }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Body Section -->
        <div class="px-8 py-8 space-y-6">
          <!-- Info Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Email -->
            <div class="space-y-2">
              <label class="label">Email Address</label>
              <div class="bg-white rounded-lg px-4 py-3 border border-slate-200">
                <p class="text-slate-900 font-medium">{{ currentUser()?.email }}</p>
              </div>
            </div>

            <!-- Phone -->
            <div class="space-y-2">
              <label class="label">Phone Number</label>
              <div class="bg-white rounded-lg px-4 py-3 border border-slate-200">
                <p class="text-slate-900 font-medium">{{ currentUser()?.phone || 'Not provided' }}</p>
              </div>
            </div>

            <!-- Member Since -->
            <div class="space-y-2">
              <label class="label">Member Since</label>
              <div class="bg-white rounded-lg px-4 py-3 border border-slate-200">
                <p class="text-slate-900 font-medium">{{ currentUser()?.createdAt | date: 'mediumDate' }}</p>
              </div>
            </div>

            <!-- Last Login -->
            <div class="space-y-2">
              <label class="label">Last Login</label>
              <div class="bg-white rounded-lg px-4 py-3 border border-slate-200">
                <p class="text-slate-900 font-medium">{{ currentUser()?.lastLogin | date: 'medium' }}</p>
              </div>
            </div>
          </div>

          <!-- Account Status -->
          <div class="bg-secondary-50 border border-secondary-200 rounded-xl p-4 flex items-center gap-3">
            <div class="w-10 h-10 bg-secondary-200 rounded-full flex items-center justify-center flex-shrink-0">
              <span class="text-lg">✓</span>
            </div>
            <div>
              <p class="font-semibold text-secondary-900">Account Status</p>
              <p class="text-secondary-600 text-sm">Your account is active and verified</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Info Box -->
      <div class="mt-8 bg-gradient-to-r from-primary-50 via-white to-primary-50 border border-primary-200 rounded-2xl p-6 shadow-sm">
        <div class="flex gap-4">
          <span class="text-3xl">📝</span>
          <div>
            <p class="font-bold text-slate-900">Profile Management</p>
            <p class="text-slate-600 text-sm mt-1">Profile editing features, including password management and notification preferences, will be available in a future update. For now, you can view your current account information above.</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProfileComponent {
  authService = inject(AuthService);

  currentUser = this.authService.currentUser;

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return '';
    return (user.firstName[0] + user.lastName[0]).toUpperCase();
  }
}
