import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
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

    const credentials: LoginRequest = {
      email: this.email,
      password: this.password
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        // Navigate to dashboard or return URL
        const returnUrl = this.getReturnUrl();
        this.router.navigate([returnUrl]);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Invalid credentials. Please try again.');
      }
    });
  }

  private getReturnUrl(): string {
    // Get return URL from query params or default to dashboard
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('returnUrl') || '/dashboard';
  }
}
