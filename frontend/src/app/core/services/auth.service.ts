import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, timer, EMPTY } from 'rxjs';
import { tap, catchError, switchMap, shareReplay } from 'rxjs/operators';
import { Router } from '@angular/router';
import {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  TokenPayload,
  RefreshTokenResponse
} from '../models';
import { environment } from '@env/environment';

const TOKEN_REFRESH_BUFFER = 60000; // Refresh 60 seconds before expiry

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/auth`;

  // Auth state using Signals (in-memory)
  private accessTokenSignal = signal<string | null>(null);
  private currentUserSignal = signal<User | null>(null);

  // Public computed signals
  public readonly currentUser = this.currentUserSignal.asReadonly();
  public readonly isAuthenticated = computed(() => this.hasValidToken());
  public readonly userRole = computed(() => this.currentUserSignal()?.role);
  public readonly userEmail = computed(() => this.currentUserSignal()?.email);

  // Token refresh observable (cached)
  private refreshTokenInProgress = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor() {
    // Try to restore session using refresh cookie
    this.tryRefreshOnInit();
  }

  // Login user
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials, {
      withCredentials: true
    }).pipe(
      tap(response => this.handleAuthSuccess(response)),
      catchError(this.handleError)
    );
  }

  /**
   * Register new user
   */
  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData, {
      withCredentials: true
    }).pipe(
      tap(response => this.handleAuthSuccess(response)),
      catchError(this.handleError)
    );
  }

  /**
   * Logout user and clear all auth data
   */
  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .pipe(catchError(() => EMPTY)) // Ignore errors during logout
      .subscribe();

    // Clear all in-memory auth data
    this.clearAuthData();
    
    // Reset refresh flow
    this.refreshTokenInProgress = false;
    this.refreshTokenSubject.complete();
    this.refreshTokenSubject = new BehaviorSubject<string | null>(null);

    // Update signals
    this.currentUserSignal.set(null);

    // Navigate to login
    this.router.navigate(['/auth/login']);
  }

  /**
   * Refresh access token using refresh token
   */
  refreshToken(): Observable<RefreshTokenResponse> {
    const hadAccessToken = !!this.getAccessToken();

    // If refresh is already in progress, wait for it
    if (this.refreshTokenInProgress) {
      return this.refreshTokenSubject.pipe(
        switchMap(token => {
          if (token) {
            // Create a fake refresh response
            return new Observable<RefreshTokenResponse>(observer => {
              observer.next({ accessToken: token });
              observer.complete();
            });
          }
          return throwError(() => new Error('Token refresh failed'));
        })
      );
    }

    this.refreshTokenInProgress = true;
    this.refreshTokenSubject.next(null);

    return this.http.post<RefreshTokenResponse>(`${this.apiUrl}/refresh`, {}, {
      withCredentials: true
    }).pipe(
      tap(response => {
        this.setAccessToken(response.accessToken);
        if (response.user) {
          this.setUser(response.user);
        }
        this.refreshTokenSubject.next(response.accessToken);
        this.refreshTokenInProgress = false;

        // Reinitialize auto-refresh with new token
        this.initializeAutoRefresh();
      }),
      catchError(error => {
        this.refreshTokenInProgress = false;
        this.refreshTokenSubject.next(null);
        if (hadAccessToken) {
          this.logout();
        } else {
          this.clearAuthData();
        }
        return throwError(() => error);
      }),
      shareReplay(1)
    );
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.accessTokenSignal();
  }

  /**
   * Check if user has valid access token
   */
  hasValidToken(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const payload = this.decodeToken(token);
      const now = Date.now() / 1000;
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  /**
   * Decode JWT token
   */
  decodeToken(token: string): TokenPayload {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Invalid token format');
    }
  }

  /**
   * Get token expiration time in milliseconds
   */
  getTokenExpirationTime(token: string): number {
    try {
      const payload = this.decodeToken(token);
      return payload.exp * 1000; // Convert to milliseconds
    } catch {
      return 0;
    }
  }

  /**
   * Initialize automatic token refresh
   */
  private initializeAutoRefresh(): void {
    const token = this.getAccessToken();
    if (!token) return;

    const expirationTime = this.getTokenExpirationTime(token);
    const now = Date.now();
    const timeUntilRefresh = expirationTime - now - TOKEN_REFRESH_BUFFER;

    if (timeUntilRefresh > 0) {
      timer(timeUntilRefresh).subscribe(() => {
        this.refreshToken().subscribe({
          error: () => {
            console.error('Auto token refresh failed');
            this.logout();
          }
        });
      });
    } else if (this.hasValidToken()) {
      // Token is still valid but close to expiry, refresh immediately
      this.refreshToken().subscribe({
        error: () => this.logout()
      });
    } else {
      // Token expired, logout
      this.logout();
    }
  }

  /**
   * Try to restore session using refresh cookie (no redirect on failure)
   */
  private tryRefreshOnInit(): void {
    this.refreshToken().subscribe({
      error: () => {
        // No active session or refresh failed; stay unauthenticated
      }
    });
  }

  /**
   * Handle successful authentication
   */
  private handleAuthSuccess(response: AuthResponse): void {
    this.setAccessToken(response.accessToken);
    this.setUser(response.user);

    // Initialize auto-refresh
    this.initializeAutoRefresh();
  }

  /**
   * Store access token
   */
  private setAccessToken(token: string): void {
    this.accessTokenSignal.set(token);
  }

  /**
   * Store user data
   */
  private setUser(user: User): void {
    this.currentUserSignal.set(user);
  }

  /**
   * Clear all auth data from memory
   */
  private clearAuthData(): void {
    this.accessTokenSignal.set(null);
    this.currentUserSignal.set(null);
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error('Auth Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
