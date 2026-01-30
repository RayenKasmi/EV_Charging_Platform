import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { signal } from '@angular/core';

describe('Auth Guards', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'userRole']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  describe('authGuard', () => {
    it('should allow access when user is authenticated', () => {
      authService.isAuthenticated.and.returnValue(true);

      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as any, { url: '/protected' } as any)
      );

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should redirect to login when user is not authenticated', () => {
      authService.isAuthenticated.and.returnValue(false);

      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as any, { url: '/protected' } as any)
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/protected' }
      });
    });
  });

  describe('guestGuard', () => {
    it('should allow access when user is not authenticated', () => {
      authService.isAuthenticated.and.returnValue(false);

      const result = TestBed.runInInjectionContext(() =>
        guestGuard({} as any, { url: '/auth/login' } as any)
      );

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should redirect to dashboard when user is authenticated', () => {
      authService.isAuthenticated.and.returnValue(true);

      const result = TestBed.runInInjectionContext(() =>
        guestGuard({} as any, { url: '/auth/login' } as any)
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  describe('roleGuard', () => {
    it('should allow access when user has required role', () => {
      authService.isAuthenticated.and.returnValue(true);
      authService.userRole.and.returnValue('admin');

      const guard = roleGuard(['admin', 'moderator']);
      const result = TestBed.runInInjectionContext(() =>
        guard({} as any, { url: '/admin' } as any)
      );

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should redirect to dashboard when user does not have required role', () => {
      authService.isAuthenticated.and.returnValue(true);
      authService.userRole.and.returnValue('user');

      const guard = roleGuard(['admin']);
      const result = TestBed.runInInjectionContext(() =>
        guard({} as any, { url: '/admin' } as any)
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should redirect to login when user is not authenticated', () => {
      authService.isAuthenticated.and.returnValue(false);

      const guard = roleGuard(['admin']);
      const result = TestBed.runInInjectionContext(() =>
        guard({} as any, { url: '/admin' } as any)
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/admin' }
      });
    });
  });
});
