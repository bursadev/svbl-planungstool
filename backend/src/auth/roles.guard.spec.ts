import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../database/enums.js';
import { RolesGuard } from './roles.guard.js';

function contextWith(user?: { role: UserRole }): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  it('passes routes without @Roles()', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(contextWith({ role: UserRole.Instructor }))).toBe(
      true,
    );
    expect(guard.canActivate(contextWith(undefined))).toBe(true);
  });

  it('passes a user whose role is listed', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      UserRole.Planner,
      UserRole.Admin,
    ]);
    expect(guard.canActivate(contextWith({ role: UserRole.Admin }))).toBe(true);
  });

  it('rejects other roles with 403', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      UserRole.Planner,
    ]);
    expect(() =>
      guard.canActivate(contextWith({ role: UserRole.Instructor })),
    ).toThrow(ForbiddenException);
    expect(() => guard.canActivate(contextWith(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
