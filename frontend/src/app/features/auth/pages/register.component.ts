import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonComponent, InputComponent, SpinnerComponent, CardComponent } from '../../../shared/components';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, InputComponent, SpinnerComponent, CardComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 flex items-center justify-center px-4 py-8">
      <div class="w-full max-w-md">
        <!-- Logo Section -->
        <div class="text-center mb-10">
          <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-400 to-accent-400 rounded-2xl flex items-center justify-center shadow-lg">
            <span class="text-3xl">⚡</span>
          </div>
          <h1 class="text-4xl font-bold bg-gradient-to-r from-primary-300 to-accent-300 bg-clip-text text-transparent mb-1">EV Charging</h1>
          <p class="text-primary-200">Platform Registration</p>
        </div>

        <!-- Registration Card -->
        <div class="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <!-- Header -->
          <div class="bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-6">
            <h2 class="text-2xl font-bold text-white">Create Your Account</h2>
            <p class="text-primary-100 text-sm mt-1">Join our charging network today</p>
          </div>

          <!-- Form Body -->
          <form [formGroup]="registerForm" (ngSubmit)="onRegister()" class="p-8 space-y-5">
            <!-- Name Fields -->
            <div class="grid grid-cols-2 gap-4">
              <app-input
                label="First Name"
                type="text"
                placeholder="John"
                formControlName="firstName"
                [error]="firstNameError"
                [required]="true"
              ></app-input>

              <app-input
                label="Last Name"
                type="text"
                placeholder="Doe"
                formControlName="lastName"
                [error]="lastNameError"
                [required]="true"
              ></app-input>
            </div>

            <!-- Email -->
            <app-input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              formControlName="email"
              [error]="emailError"
              [required]="true"
            ></app-input>

            <!-- Password -->
            <app-input
              label="Password"
              type="password"
              placeholder="Create a secure password"
              formControlName="password"
              [error]="passwordError"
              [required]="true"
            ></app-input>

            <!-- Confirm Password -->
            <app-input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter your password"
              formControlName="confirmPassword"
              [error]="confirmPasswordError"
              [required]="true"
            ></app-input>

            <!-- Password Requirements -->
            <div class="bg-secondary-50 border-2 border-secondary-200 rounded-xl p-4">
              <div class="flex gap-2 mb-3">
                <span class="text-xl">🔐</span>
                <p class="font-semibold text-secondary-900">Password Requirements</p>
              </div>
              <ul class="space-y-2 text-sm text-secondary-700">
                <li class="flex gap-2">
                  <span>✓</span>
                  <span>At least 8 characters</span>
                </li>
                <li class="flex gap-2">
                  <span>✓</span>
                  <span>One uppercase letter</span>
                </li>
                <li class="flex gap-2">
                  <span>✓</span>
                  <span>One number</span>
                </li>
                <li class="flex gap-2">
                  <span>✓</span>
                  <span>One special character (!@#$%^&*)</span>
                </li>
              </ul>
            </div>

            <!-- Register Button -->
            <button
              type="submit"
              [disabled]="isLoading"
              class="w-full btn btn-primary lg flex items-center justify-center gap-2"
            >
              <app-spinner *ngIf="isLoading" [size]="20"></app-spinner>
              {{ isLoading ? 'Creating account...' : 'Create Account' }}
            </button>
          </form>

          <!-- Footer -->
          <div class="px-8 py-4 bg-slate-50 border-t border-slate-200 text-center text-sm text-slate-600">
            Already have an account?
            <a routerLink="/auth/login" class="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
              Sign in here
            </a>
          </div>
        </div>

        <!-- Security Note -->
        <div class="mt-6 text-center text-primary-200 text-xs">
          <p>🔒 Your information is protected by industry-standard encryption</p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.registerForm = this.fb.group(
      {
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, this.passwordValidator.bind(this)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasLength = value.length >= 8;
    const hasUppercase = /[A-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecial = /[!@#$%^&*]/.test(value);

    const passwordValid = hasLength && hasUppercase && hasNumber && hasSpecial;
    return passwordValid ? null : { invalidPassword: true };
  }

  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  get firstNameError(): string | undefined {
    const control = this.registerForm.get('firstName');
    if (control?.hasError('required')) return 'First name is required';
    if (control?.hasError('minlength')) return 'First name must be at least 2 characters';
    return undefined;
  }

  get lastNameError(): string | undefined {
    const control = this.registerForm.get('lastName');
    if (control?.hasError('required')) return 'Last name is required';
    if (control?.hasError('minlength')) return 'Last name must be at least 2 characters';
    return undefined;
  }

  get emailError(): string | undefined {
    const control = this.registerForm.get('email');
    if (control?.hasError('required')) return 'Email is required';
    if (control?.hasError('email')) return 'Invalid email format';
    return undefined;
  }

  get passwordError(): string | undefined {
    const control = this.registerForm.get('password');
    if (control?.hasError('required')) return 'Password is required';
    if (control?.hasError('invalidPassword'))
      return 'Password must contain uppercase, number, and special character';
    return undefined;
  }

  get confirmPasswordError(): string | undefined {
    const control = this.registerForm.get('confirmPassword');
    if (control?.hasError('required')) return 'Confirm password is required';
    if (this.registerForm.hasError('passwordMismatch')) return 'Passwords do not match';
    return undefined;
  }

  onRegister(): void {
    if (this.registerForm.invalid) return;

    this.isLoading = true;
    const { firstName, lastName, email, password } = this.registerForm.value;

    this.authService.register({ firstName, lastName, email, password }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.toastService.showSuccess('Account created successfully!');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.showError('Registration failed. Please try again.');
      },
    });
  }
}
