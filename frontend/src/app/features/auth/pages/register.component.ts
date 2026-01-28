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
    <div class="min-h-screen bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center px-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-white mb-2">EV Charging</h1>
          <p class="text-green-100">Platform</p>
        </div>

        <app-card title="Create Account">
          <form [formGroup]="registerForm" (ngSubmit)="onRegister()" class="space-y-4">
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

            <app-input
              label="Email"
              type="email"
              placeholder="you@example.com"
              formControlName="email"
              [error]="emailError"
              [required]="true"
            ></app-input>

            <app-input
              label="Password"
              type="password"
              placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special char"
              formControlName="password"
              [error]="passwordError"
              [required]="true"
            ></app-input>

            <app-input
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              formControlName="confirmPassword"
              [error]="confirmPasswordError"
              [required]="true"
            ></app-input>

            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p class="font-semibold mb-1">Password Requirements:</p>
              <ul class="list-disc list-inside space-y-1">
                <li>At least 8 characters</li>
                <li>One uppercase letter</li>
                <li>One number</li>
                <li>One special character (!@#$%^&*)</li>
              </ul>
            </div>

            <button
              type="submit"
              [disabled]="isLoading"
              class="w-full btn-primary flex items-center justify-center gap-2"
            >
              <app-spinner *ngIf="isLoading" [size]="20"></app-spinner>
              {{ isLoading ? 'Creating account...' : 'Register' }}
            </button>
          </form>

          <div class="mt-6 text-center text-sm text-gray-600">
            Already have an account?
            <a routerLink="/auth/login" class="text-green-600 hover:text-green-800 font-medium">
              Sign in here
            </a>
          </div>
        </app-card>
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
