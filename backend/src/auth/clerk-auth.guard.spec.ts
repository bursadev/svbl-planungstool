import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { verifyToken } from '@clerk/backend';
import { ClerkAuthGuard } from './clerk-auth.guard.js';

vi.mock('@clerk/backend', () => ({ verifyToken: vi.fn() }));

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
  let guard: ClerkAuthGuard;

  beforeEach(() => {
    vi.mocked(verifyToken).mockReset();
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    guard = new ClerkAuthGuard(reflector, config);
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

  it('sets userId from a valid token', async () => {
    vi.mocked(verifyToken).mockResolvedValue({ sub: 'user_123' } as never);
    const req: Record<string, unknown> = {
      headers: { authorization: 'Bearer good' },
    };

    await expect(guard.canActivate(contextWith(req))).resolves.toBe(true);
    expect(req.userId).toBe('user_123');
    expect(verifyToken).toHaveBeenCalledWith('good', {
      secretKey: 'sk_test',
      authorizedParties: ['http://localhost:3000'],
    });
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
});
