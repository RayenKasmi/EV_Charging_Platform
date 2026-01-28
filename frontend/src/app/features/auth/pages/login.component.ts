import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonComponent, InputComponent, SpinnerComponent, CardComponent } from '../../../shared/components';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, InputComponent, SpinnerComponent, CardComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 flex items-center justify-center px-4 py-12">
      <div class="w-full max-w-md">
        <!-- Header -->
        <div class="text-center mb-10">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-400 to-accent-500 rounded-2xl mb-4 shadow-lg">
            <span class="text-3xl">⚡</span>
          </div>
          <h1 class="text-4xl font-bold text-white mb-2">EV Charge</h1>
          <p class="text-primary-200">Platform</p>
        </div>

        <!-- Login Card -->
        <div class="bg-white rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
          <div class="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-8">
            <h2 class="text-2xl font-bold text-white">Welcome Back</h2>
            <p class="text-primary-100 text-sm mt-1">Sign in to your account</p>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onLogin()" class="p-8 space-y-5">
            <div>
              <app-input
                label="Email Address"
                type="email"
                placeholder="admin@example.com"
                formControlName="email"
                [error]="emailError"
                [required]="true"
              ></app-input>
            </div>

            <div>
              <app-input
                label="Password"
                type="password"
                placeholder="••••••••"
                formControlName="password"
                [error]="passwordError"
                [required]="true"
              ></app-input>
            </div>

            <!-- Demo Credentials Box -->
            <div class="bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-200 rounded-xl p-4">
              <p class="font-semibold text-slate-900 text-sm mb-3">📋 Demo Credentials</p>
              <div class="space-y-2 text-xs">
                <div class="flex items-center gap-2 text-slate-700">
                  <span class="text-primary-600 font-bold">👑</span>
                  <span><strong>Admin:</strong> admin@example.com / Admin123!</span>
                </div>
                <div class="flex items-center gap-2 text-slate-700">
                  <span class="text-secondary-600 font-bold">⚙️</span>
                  <span><strong>Operator:</strong> operator@example.com / Operator123!</span>
                </div>
                <div class="flex items-center gap-2 text-slate-700">
                  <span class="text-accent-600 font-bold">🚗</span>
                  <span><strong>Driver:</strong> driver@example.com / Driver123!</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              [disabled]="isLoading"
              class="w-full btn btn-primary lg mt-6 shadow-lg"
            >
              <app-spinner *ngIf="isLoading" [size]="20"></app-spinner>
              {{ isLoading ? 'Signing in...' : 'Sign In' }}
            </button>
          </form>

          <div class="px-8 py-6 bg-slate-50 border-t border-slate-100 text-center">
            <p class="text-sm text-slate-600">
              Don't have an account?
              <a routerLink="/auth/register" class="text-primary-600 hover:text-primary-700 font-bold transition-colors">
                Create one now
              </a>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <p class="text-center text-primary-100 text-xs mt-6">© 2026 EV Charging Platform. All rights reserved.</p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.loginForm = this.fb.group({
      email: ['admin@example.com', [Validators.required, Validators.email]],
      password: ['Admin123!', [Validators.required, Validators.minLength(8)]],
    });
  }

  get emailError(): string | undefined {
    const control = this.loginForm.get('email');
    if (control?.hasError('required')) return 'Email is required';
    if (control?.hasError('email')) return 'Invalid email format';
    return undefined;
  }

  get passwordError(): string | undefined {
    const control = this.loginForm.get('password');
    if (control?.hasError('required')) return 'Password is required';
    if (control?.hasError('minlength')) return 'Password must be at least 8 characters';
    return undefined;
  }

  onLogin(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.toastService.showSuccess(`Welcome ${response.user.firstName}!`);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.showError('Invalid email or password');
      },
    });
  }
}
