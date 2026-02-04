import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard to protect routes that require authentication
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirect to login with return URL
  router.navigate(['/auth/login'], {
    queryParams: {
      returnUrl: state.url,
      error: 'Please sign in to continue.'
    }
  });
  
  return false;
};

/**
 * Guest Guard to prevent authenticated users from accessing auth pages
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // Redirect authenticated users to dashboard
  router.navigate(['/dashboard'], {
    queryParams: { error: "You're already signed in." }
  });
  return false;
};

/**
 * Role Guard to protect routes based on user role
 */
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      router.navigate(['/auth/login'], {
        queryParams: {
          returnUrl: state.url,
          error: 'Please sign in to continue.'
        }
      });
      return false;
    }

    const userRole = authService.userRole();
    if (userRole && allowedRoles.includes(userRole)) {
      return true;
    }

    // User doesn't have required role
    router.navigate(['/dashboard'], {
      queryParams: { error: 'You do not have permission to access this page.' }
    });
    return false;
  };
};
