import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import type { AuthUser } from '../auth/clerk-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Roles, WRITE_ROLES } from '../auth/roles.decorator.js';
import { uuidPipe } from '../common/uuid.pipe.js';
import { UserRole } from '../database/enums.js';
import { UpdateUserDto } from './dto/user.dto.js';
import { UsersService } from './users.service.js';

/** Accounts mirror Clerk (ADR-0003): invitations and roles are managed there. */
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles(...WRITE_ROLES)
  list() {
    return this.users.list();
  }

  @Patch(':id')
  @Roles(UserRole.Admin)
  update(
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.users.update(id, dto, user);
  }
}
