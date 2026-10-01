import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from '../src/auth/clerk-auth.guard.js';
import { IS_PUBLIC_KEY } from '../src/auth/public.decorator.js';
import { UserRole } from '../src/database/enums.js';
import { UsersService } from '../src/users/users.service.js';

/**
 * Replaces ClerkAuthGuard in e2e tests: the role comes from the `x-test-role`
 * header (and optionally `x-test-user` for the Clerk id). Without the header
 * the request is 401, like a missing token. The user row is upserted the
 * same way the real guard does it.
 */
@Injectable()
export class TestAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly users: UsersService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const role = req.headers['x-test-role'];
    if (
      typeof role !== 'string' ||
      !Object.values(UserRole).includes(role as UserRole)
    ) {
      throw new UnauthorizedException('Nicht angemeldet.');
    }
    const userId =
      typeof req.headers['x-test-user'] === 'string'
        ? req.headers['x-test-user']
        : `test_${role}`;
    const email = `${userId}@test.svbl.ch`;
    const dbUserId = await this.users.touch({
      userId,
      role: role as UserRole,
      email,
      displayName: `Test ${role}`,
    });
    req.user = {
      userId,
      role: role as UserRole,
      dbUserId,
      email,
      displayName: `Test ${role}`,
    };
    return true;
  }
}
