import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { hasAnyRequiredRole } from '../utils/role-hierarchy.util';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from the @Roles() decorator
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get user from request (set by JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user is authenticated, deny access
    if (!user || !user.role) {
      throw new ForbiddenException('Access denied: insufficient permissions');
    }

    // Check if user's role meets any of the required roles (with hierarchy)
    const hasPermission = hasAnyRequiredRole(user.role, requiredRoles);

    if (!hasPermission) {
      throw new ForbiddenException(
        `Access denied: requires one of the following roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
