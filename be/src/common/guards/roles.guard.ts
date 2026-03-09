import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RequestUser } from '../interfaces/request-user.interface';

/**
 * Guard that enforces role-based access control (RBAC).
 * Reads the required roles from @Roles() metadata and compares
 * against the authenticated user's role on req.user.
 *
 * If no @Roles() decorator is present, access is granted.
 * If the user's role is not in the required list, throws 403 Forbidden.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /** @inheritdoc */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as Request & { user: RequestUser }).user;

    if (!user) {
      throw new ForbiddenException('No authenticated user found');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return true;
  }
}
