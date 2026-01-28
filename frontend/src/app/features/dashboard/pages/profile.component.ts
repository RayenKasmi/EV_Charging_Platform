import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../../shared/components';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, CardComponent],
  template: `
    <div class="max-w-2xl">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">My Profile</h2>

      <app-card>
        <div class="flex items-center gap-6 mb-6">
          <div
            class="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold"
          >
            {{ getUserInitials() }}
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-900">
              {{ currentUser()?.firstName }} {{ currentUser()?.lastName }}
            </h3>
            <p class="text-gray-600">{{ currentUser()?.email }}</p>
            <span class="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {{ currentUser()?.role }}
            </span>
          </div>
        </div>

        <div class="space-y-4 border-t border-gray-200 pt-6">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-600">Email</label>
              <p class="text-gray-900 mt-1">{{ currentUser()?.email }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">Phone</label>
              <p class="text-gray-900 mt-1">{{ currentUser()?.phone || 'Not provided' }}</p>
            </div>
          </div>

          <div>
            <label class="text-sm font-medium text-gray-600">Member Since</label>
            <p class="text-gray-900 mt-1">
              {{ currentUser()?.createdAt | date: 'mediumDate' }}
            </p>
          </div>

          <div>
            <label class="text-sm font-medium text-gray-600">Last Login</label>
            <p class="text-gray-900 mt-1">
              {{ currentUser()?.lastLogin | date: 'medium' }}
            </p>
          </div>
        </div>
      </app-card>

      <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p class="text-blue-800">
          💡 <strong>Note:</strong> Profile editing features will be available in a future update.
        </p>
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
