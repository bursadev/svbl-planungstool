import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { verifyToken } from '@clerk/backend';
import { UserRole } from '../database/enums.js';
import type { UsersService } from '../users/users.service.js';
import { ClerkAuthGuard } from './clerk-auth.guard.js';

const getUser = vi.fn();
vi.mock('@clerk/backend', () => ({
  verifyToken: vi.fn(),
  createClerkClient: () => ({ users: { getUser } }),
}));

function contextWith(req: Record<string, unknown>): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

describe('ClerkAuthGuard', () => {
  const reflector = new Reflector();
  const config = new ConfigService({
    CLERK_SECRET_KEY: 'sk_test',
    CLERK_AUTHORIZED_PARTIES: 'http://localhost:3000',
  });
  const touch = vi.fn();
  const users = { touch } as unknown as UsersService;
  let guard: ClerkAuthGuard;

  beforeEach(() => {
    vi.mocked(verifyToken).mockReset();
    getUser.mockReset();
    touch.mockReset().mockResolvedValue('db-user-1');
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    guard = new ClerkAuthGuard(reflector, config, users);
  });

  it('lets @Public() routes through without a token', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    await expect(guard.canActivate(contextWith({ headers: {} }))).resolves.toBe(
      true,
    );
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it('rejects requests without a bearer token', async () => {
    await expect(
      guard.canActivate(contextWith({ headers: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an invalid token', async () => {
    vi.mocked(verifyToken).mockRejectedValue(
      Object.assign(new Error('bad'), { reason: 'token-invalid' }),
    );
    await expect(
      guard.canActivate(
        contextWith({ headers: { authorization: 'Bearer bad' } }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('builds the user from role and email claims without calling Clerk', async () => {
    vi.mocked(verifyToken).mockResolvedValue({
      sub: 'user_123',
      role: 'planner',
      email: 'p@svbl.ch',
      name: 'Pia Planung',
    } as never);
    const req: Record<string, unknown> = {
      headers: { authorization: 'Bearer good' },
    };

    await expect(guard.canActivate(contextWith(req))).resolves.toBe(true);
    expect(req.user).toEqual({
      userId: 'user_123',
      role: UserRole.Planner,
      email: 'p@svbl.ch',
      displayName: 'Pia Planung',
      dbUserId: 'db-user-1',
    });
    expect(getUser).not.toHaveBeenCalled();
    expect(touch).toHaveBeenCalledWith({
      userId: 'user_123',
      role: 'planner',
      email: 'p@svbl.ch',
      displayName: 'Pia Planung',
    });
    expect(verifyToken).toHaveBeenCalledWith('good', {
      secretKey: 'sk_test',
      authorizedParties: ['http://localhost:3000'],
    });
  });

  it('fetches role and email from Clerk when the token has no claims, and caches it', async () => {
    vi.mocked(verifyToken).mockResolvedValue({ sub: 'user_9' } as never);
    getUser.mockResolvedValue({
      publicMetadata: { role: 'admin' },
      primaryEmailAddressId: 'e1',
      emailAddresses: [{ id: 'e1', emailAddress: 'a@svbl.ch' }],
      firstName: 'Ada',
      lastName: 'Admin',
    });
    const req: Record<string, unknown> = {
      headers: { authorization: 'Bearer good' },
    };

    await guard.canActivate(contextWith(req));
    await guard.canActivate(contextWith(req));
    expect((req.user as { role: string }).role).toBe('admin');
    expect((req.user as { email: string }).email).toBe('a@svbl.ch');
    expect(getUser).toHaveBeenCalledTimes(1);
  });

  it('refuses users without a role', async () => {
    vi.mocked(verifyToken).mockResolvedValue({ sub: 'user_0' } as never);
    getUser.mockResolvedValue({
      publicMetadata: {},
      primaryEmailAddressId: null,
      emailAddresses: [{ id: 'e1', emailAddress: 'x@svbl.ch' }],
    });
    await expect(
      guard.canActivate(
        contextWith({ headers: { authorization: 'Bearer good' } }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
