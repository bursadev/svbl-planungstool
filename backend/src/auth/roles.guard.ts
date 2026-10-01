import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '../database/enums.js';
import type { AuthenticatedRequest } from './clerk-auth.guard.js';
import { ROLES_KEY } from './roles.decorator.js';

/**
 * Enforces @Roles() after ClerkAuthGuard has put the user on the request.
 * Routes without @Roles() pass; public routes have no user and pass too.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!roles || roles.length === 0) return true;

    const user = ctx.switchToHttp().getRequest<AuthenticatedRequest>().user;
    if (user && roles.includes(user.role)) return true;
    throw new ForbiddenException('Keine Berechtigung.');
  }
}
