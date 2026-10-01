import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import {
  createClerkClient,
  verifyToken,
  type ClerkClient,
} from '@clerk/backend';
import type { Request } from 'express';
import { UserRole } from '../database/enums.js';
import { UsersService, type UserProfile } from '../users/users.service.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';

/** The signed-in person as every handler sees it via @CurrentUser(). */
export interface AuthUser extends UserProfile {
  /** Internal `user.id`, for created_by and audit entries. */
  dbUserId: string;
}

export type AuthenticatedRequest = Request & { user?: AuthUser };

type Claims = { sub: string } & Record<string, unknown>;

/** How long a profile fetched from the Clerk API is reused. */
const PROFILE_CACHE_MS = 10 * 60_000;
const ROLES = new Set<string>(Object.values(UserRole));

/**
 * Authenticates the Clerk session JWT sent as `Authorization: Bearer <token>`
 * and resolves the user's role. Registered globally, so every route is
 * protected unless marked @Public().
 *
 * The role lives in Clerk's `publicMetadata.role`. When the session token is
 * customised to carry `role` and `email` claims, no API call is needed;
 * otherwise the user is fetched from Clerk once per cache interval. The
 * `user` row is upserted through UsersService.
 */
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);
  private readonly secretKey: string;
  private readonly authorizedParties: string[] | undefined;
  private readonly defaultRole: UserRole | undefined;
  private readonly clerk: ClerkClient;
  private readonly profiles = new Map<
    string,
    { at: number; profile: UserProfile }
  >();

  constructor(
    private readonly reflector: Reflector,
    config: ConfigService,
    private readonly users: UsersService,
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
    this.clerk = createClerkClient({ secretKey: this.secretKey });
    // Development convenience for accounts without a role in Clerk yet; never in production.
    const fallback = config.get<string>('AUTH_DEFAULT_ROLE');
    this.defaultRole =
      process.env.NODE_ENV !== 'production' ? roleOf(fallback) : undefined;
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

    const claims = await this.verify(token);
    const profile = await this.resolveProfile(claims);
    const dbUserId = await this.users.touch(profile);
    req.user = { ...profile, dbUserId };
    return true;
  }

  private async verify(token: string): Promise<Claims> {
    try {
      return (await verifyToken(token, {
        secretKey: this.secretKey,
        authorizedParties: this.authorizedParties,
      })) as Claims;
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

  private async resolveProfile(claims: Claims): Promise<UserProfile> {
    const userId = claims.sub;
    const claimRole = roleOf(claims.role);
    const claimEmail =
      typeof claims.email === 'string' ? claims.email : undefined;
    if (claimRole && claimEmail) {
      return {
        userId,
        role: claimRole,
        email: claimEmail,
        displayName: typeof claims.name === 'string' ? claims.name : null,
      };
    }

    const cached = this.profiles.get(userId);
    if (cached && Date.now() - cached.at < PROFILE_CACHE_MS) {
      return cached.profile;
    }

    const user = await this.clerk.users.getUser(userId);
    const role =
      claimRole ??
      roleOf((user.publicMetadata as Record<string, unknown>)?.role) ??
      this.defaultRole;
    if (!role) {
      throw new ForbiddenException('Dem Benutzer ist keine Rolle zugewiesen.');
    }
    const email =
      claimEmail ??
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress ??
      user.emailAddresses[0]?.emailAddress;
    if (!email) {
      throw new ForbiddenException(
        'Dem Benutzer ist keine E-Mail-Adresse zugeordnet.',
      );
    }
    const displayName =
      [user.firstName, user.lastName].filter(Boolean).join(' ') || null;
    const profile: UserProfile = { userId, role, email, displayName };
    this.profiles.set(userId, { at: Date.now(), profile });
    return profile;
  }
}

function roleOf(value: unknown): UserRole | undefined {
  return typeof value === 'string' && ROLES.has(value)
    ? (value as UserRole)
    : undefined;
}
