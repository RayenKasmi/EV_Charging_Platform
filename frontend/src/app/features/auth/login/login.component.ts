import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-xl shadow-xl p-8">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">Welcome Back</h2>

      @if (errorMessage()) {
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {{ errorMessage() }}
        </div>
      }

      <form (ngSubmit)="onSubmit()" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            [(ngModel)]="email"
            name="email"
            required
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            [(ngModel)]="password"
            name="password"
            required
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          [disabled]="isLoading()"
          class="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          @if (isLoading()) {
            <span>Logging in...</span>
          } @else {
            <span>Log In</span>
          }
        </button>
      </form>

      <div class="mt-6 text-center text-sm text-gray-600">
        <p>Use any valid email address to log in</p>
      </div>
    </div>
  `
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  isLoading = signal(false);
  errorMessage = signal('');

  onSubmit(): void {
    this.errorMessage.set('');

    if (!this.email || !this.password) {
      this.errorMessage.set('Please fill in all fields');
      return;
    }

    this.isLoading.set(true);

    setTimeout(() => {
      const success = this.authService.login(this.email, this.password);

      if (success) {
        this.router.navigate(['/dashboard']);
      } else {
        this.errorMessage.set('Invalid credentials. Please use a valid email address.');
      }

      this.isLoading.set(false);
    }, 500);
  }
}
