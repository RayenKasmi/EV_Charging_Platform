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

const ACCESS_TOKEN_KEY = 'ev_access_token';
const REFRESH_TOKEN_KEY = 'ev_refresh_token';
const USER_KEY = 'ev_user';
const TOKEN_REFRESH_BUFFER = 60000; // Refresh 60 seconds before expiry

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/auth`;

  // Auth state using Signals
  private currentUserSignal = signal<User | null>(this.getUserFromStorage());
  private authStateSignal = signal<boolean>(this.hasValidToken());

  // Public computed signals
  public readonly currentUser = this.currentUserSignal.asReadonly();
  public readonly isAuthenticated = computed(() => this.authStateSignal());
  public readonly userRole = computed(() => this.currentUserSignal()?.role);
  public readonly userEmail = computed(() => this.currentUserSignal()?.email);

  // Token refresh observable (cached)
  private refreshTokenInProgress = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor() {
    // Initialize auto-refresh if token exists
    this.initializeAutoRefresh();
  }

  // Login user
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => this.handleAuthSuccess(response)),
      catchError(this.handleError)
    );
  }

  /**
   * Register new user
   */
  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => this.handleAuthSuccess(response)),
      catchError(this.handleError)
    );
  }

  /**
   * Logout user and clear all auth data
   */
  logout(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.http.post(`${this.apiUrl}/logout`, { refreshToken })
        .pipe(catchError(() => EMPTY)) // Ignore errors during logout
        .subscribe();
    }

    // Clear all local storage
    this.clearAuthData();
    
    // Reset refresh flow
    this.refreshTokenInProgress = false;
    this.refreshTokenSubject.complete();
    this.refreshTokenSubject = new BehaviorSubject<string | null>(null);

    // Update signals
    this.currentUserSignal.set(null);
    this.authStateSignal.set(false);

    // Navigate to login
    this.router.navigate(['/auth/login']);
  }

  /**
   * Refresh access token using refresh token
   */
  refreshToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    // If refresh is already in progress, wait for it
    if (this.refreshTokenInProgress) {
      return this.refreshTokenSubject.pipe(
        switchMap(token => {
          if (token) {
            // Create a fake refresh response
            return new Observable<RefreshTokenResponse>(observer => {
              observer.next({ accessToken: token, refreshToken: this.getRefreshToken()! });
              observer.complete();
            });
          }
          return throwError(() => new Error('Token refresh failed'));
        })
      );
    }

    this.refreshTokenInProgress = true;
    this.refreshTokenSubject.next(null);

    return this.http.post<RefreshTokenResponse>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap(response => {
        this.setAccessToken(response.accessToken);
        this.setRefreshToken(response.refreshToken);
        this.refreshTokenSubject.next(response.accessToken);
        this.refreshTokenInProgress = false;
        
        // Update auth state
        this.authStateSignal.set(true);

        // Reinitialize auto-refresh with new token
        this.initializeAutoRefresh();
      }),
      catchError(error => {
        this.refreshTokenInProgress = false;
        this.refreshTokenSubject.next(null);
        this.logout();
        return throwError(() => error);
      }),
      shareReplay(1)
    );
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
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
   * Handle successful authentication
   */
  private handleAuthSuccess(response: AuthResponse): void {
    this.setAccessToken(response.accessToken);
    this.setRefreshToken(response.refreshToken);
    this.setUser(response.user);

    // Update signals
    this.currentUserSignal.set(response.user);
    this.authStateSignal.set(true);

    // Initialize auto-refresh
    this.initializeAutoRefresh();
  }

  /**
   * Store access token
   */
  private setAccessToken(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }

  /**
   * Store refresh token
   */
  private setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  /**
   * Store user data
   */
  private setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  /**
   * Get user from storage
   */
  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem(USER_KEY);
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
   * Clear all auth data from storage
   */
  private clearAuthData(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
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
