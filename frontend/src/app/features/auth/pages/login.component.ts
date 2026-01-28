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
    <div class="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-white mb-2">EV Charging</h1>
          <p class="text-blue-100">Platform</p>
        </div>

        <app-card title="Sign In">
          <form [formGroup]="loginForm" (ngSubmit)="onLogin()" class="space-y-4">
            <app-input
              label="Email"
              type="email"
              placeholder="admin@example.com"
              formControlName="email"
              [error]="emailError"
              [required]="true"
            ></app-input>

            <app-input
              label="Password"
              type="password"
              placeholder="Admin123!"
              formControlName="password"
              [error]="passwordError"
              [required]="true"
            ></app-input>

            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p class="font-semibold mb-2">Demo Credentials:</p>
              <p>👤 Admin: admin@example.com / Admin123!</p>
              <p>👤 Operator: operator@example.com / Operator123!</p>
              <p>👤 Driver: driver@example.com / Driver123!</p>
            </div>

            <button
              type="submit"
              [disabled]="isLoading"
              class="w-full btn-primary flex items-center justify-center gap-2"
            >
              <app-spinner *ngIf="isLoading" [size]="20"></app-spinner>
              {{ isLoading ? 'Signing in...' : 'Sign In' }}
            </button>
          </form>

          <div class="mt-6 text-center text-sm text-gray-600">
            Don't have an account?
            <a routerLink="/auth/register" class="text-blue-600 hover:text-blue-800 font-medium">
              Register here
            </a>
          </div>
        </app-card>
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
