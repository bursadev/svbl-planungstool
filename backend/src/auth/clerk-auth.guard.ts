import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { verifyToken } from '@clerk/backend';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator.js';

export type AuthenticatedRequest = Request & { userId?: string };

/**
 * Authenticates the Clerk session JWT sent as `Authorization: Bearer <token>`.
 * Registered globally, so every route is protected unless marked @Public().
 */
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);
  private readonly secretKey: string;
  private readonly authorizedParties: string[] | undefined;

  constructor(
    private readonly reflector: Reflector,
    config: ConfigService,
  ) {
    this.secretKey = config.getOrThrow<string>('CLERK_SECRET_KEY');
    // Origins allowed to mint tokens for this API, so a JWT issued to another
    // app on the same Clerk instance can't be replayed here.
    const parties = config
      .get<string>('CLERK_AUTHORIZED_PARTIES', '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    this.authorizedParties = parties.length ? parties : undefined;
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new UnauthorizedException('Nicht angemeldet.');

    try {
      const claims = await verifyToken(token, {
        secretKey: this.secretKey,
        authorizedParties: this.authorizedParties,
      });
      req.userId = claims.sub;
      return true;
    } catch (err) {
      // Invalid/expired tokens are the normal case → quiet 401. Clerk's
      // TokenVerificationError carries a `reason`; anything without one
      // (JWKS fetch failure, misconfiguration) is an infra problem worth logging.
      const isTokenError = err instanceof Error && 'reason' in err;
      if (!isTokenError) {
        const cause =
          err instanceof Error ? `${err.name}: ${err.message}` : String(err);
        this.logger.error(`verifyToken failed unexpectedly: ${cause}`);
      }
      throw new UnauthorizedException('Nicht angemeldet.');
    }
  }
}
