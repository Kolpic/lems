import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator that sets the required roles for accessing a route.
 * Used in conjunction with RolesGuard to enforce RBAC.
 *
 * @param roles - One or more role names required for access (e.g., 'ADMIN', 'USER')
 * @returns MethodDecorator & ClassDecorator
 *
 * @example
 * \@Roles('ADMIN')
 * \@Post()
 * async createPM() { ... }
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
