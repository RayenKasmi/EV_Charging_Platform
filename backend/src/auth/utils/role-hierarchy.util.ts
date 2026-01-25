import { UserRole } from '../enums/user-role.enum';

/**
 * Role hierarchy levels (higher number = more permissions)
 */
const roleHierarchy: Record<UserRole, number> = {
  [UserRole.CUSTOMER]: 1,
  [UserRole.OPERATOR]: 2,
  [UserRole.ADMIN]: 3,
};

/**
 * Check if a user's role has sufficient permissions for the required role
 * @param userRole - The user's current role
 * @param requiredRole - The required role for the operation
 * @returns true if user has sufficient permissions
 */
export function hasRequiredRole(userRole: string, requiredRole: string): boolean {
  const userLevel = roleHierarchy[userRole as UserRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole as UserRole] || 0;
  
  return userLevel >= requiredLevel;
}

/**
 * Check if a user's role meets any of the required roles
 * @param userRole - The user's current role
 * @param requiredRoles - Array of acceptable roles
 * @returns true if user has one of the required roles or higher
 */
export function hasAnyRequiredRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.some(requiredRole => hasRequiredRole(userRole, requiredRole));
}
