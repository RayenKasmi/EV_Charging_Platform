import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models';

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const currentUserRole = authService.userRole();

    if (currentUserRole && allowedRoles.includes(currentUserRole)) {
      return true;
    }

    router.navigate(['/dashboard']);
    return false;
  };
};

// Specific role guards
export const adminGuard: CanActivateFn = roleGuard([UserRole.ADMIN]);

export const operatorGuard: CanActivateFn = roleGuard([
  UserRole.ADMIN,
  UserRole.OPERATOR,
]);

export const driverGuard: CanActivateFn = roleGuard([
  UserRole.ADMIN,
  UserRole.DRIVER,
]);
