import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User, UserRole, AuthResponse, RegisterDto } from '../models';
import { DummyDataService } from './dummy-data.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Signals for reactive state
  private currentUserSignal = signal<User | null>(this.loadCurrentUser());
  private isAuthenticatedSignal = signal<boolean>(this.isUserAuthenticated());
  private tokenSignal = signal<string | null>(localStorage.getItem('access_token'));

  // Computed signals
  currentUser = computed(() => this.currentUserSignal());
  isAuthenticated = computed(() => this.isAuthenticatedSignal());
  userRole = computed(() => this.currentUserSignal()?.role);
  hasRole = (role: UserRole) => computed(() => this.userRole() === role);

  constructor(
    private dummyDataService: DummyDataService,
    private router: Router
  ) {}

  /**
   * Login user
   */
  login(email: string, password: string): Observable<AuthResponse> {
    return this.dummyDataService.login(email, password).pipe(
      tap((response: AuthResponse) => {
        this.setAuthState(response);
      })
    );
  }

  /**
   * Register new user
   */
  register(registrationData: RegisterDto): Observable<AuthResponse> {
    return this.dummyDataService.register(
      registrationData.email,
      registrationData.password,
      registrationData.firstName,
      registrationData.lastName
    ).pipe(
      tap((response: AuthResponse) => {
        this.setAuthState(response);
      })
    );
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
    this.currentUserSignal.set(null);
    this.isAuthenticatedSignal.set(false);
    this.tokenSignal.set(null);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.tokenSignal();
  }

  /**
   * Check if user is authenticated
   */
  private isUserAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    const user = this.loadCurrentUser();
    return !!token && !!user;
  }

  /**
   * Load current user from localStorage
   */
  private loadCurrentUser(): User | null {
    const userJson = localStorage.getItem('current_user');
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Set authentication state
   */
  private setAuthState(response: AuthResponse): void {
    localStorage.setItem('access_token', response.accessToken);
    if (response.refreshToken) {
      localStorage.setItem('refresh_token', response.refreshToken);
    }
    localStorage.setItem('current_user', JSON.stringify(response.user));

    this.currentUserSignal.set(response.user);
    this.isAuthenticatedSignal.set(true);
    this.tokenSignal.set(response.accessToken);
  }

  /**
   * Refresh authentication (simulated)
   */
  refreshAuth(): void {
    const user = this.loadCurrentUser();
    if (user) {
      this.currentUserSignal.set(user);
      this.isAuthenticatedSignal.set(true);
    }
  }
}
