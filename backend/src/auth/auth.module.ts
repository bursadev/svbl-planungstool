import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from '../users/users.module.js';
import { ClerkAuthGuard } from './clerk-auth.guard.js';
import { RolesGuard } from './roles.guard.js';

/**
 * Protects every route: ClerkAuthGuard authenticates (opt out with @Public()),
 * RolesGuard enforces @Roles(). The guards are registered through their own
 * providers so e2e tests can replace ClerkAuthGuard with a stub.
 */
@Module({
  imports: [UsersModule],
  providers: [
    ClerkAuthGuard,
    RolesGuard,
    { provide: APP_GUARD, useExisting: ClerkAuthGuard },
    { provide: APP_GUARD, useExisting: RolesGuard },
  ],
})
export class AuthModule {}
