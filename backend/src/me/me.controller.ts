import { Controller, Get } from '@nestjs/common';
import type { AuthUser } from '../auth/clerk-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('me')
export class MeController {
  /** Who am I: the web app reads the role from here. */
  @Get()
  me(@CurrentUser() user: AuthUser) {
    return {
      userId: user.userId,
      role: user.role,
      email: user.email,
      displayName: user.displayName,
    };
  }
}
