import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Put,
} from '@nestjs/common';
import type { AuthUser } from '../auth/clerk-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Roles, WRITE_ROLES } from '../auth/roles.decorator.js';
import { UserRole } from '../database/enums.js';
import { UpsertSettingDto } from './dto/setting.dto.js';
import { SettingsService } from './settings.service.js';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  @Roles(...WRITE_ROLES)
  list() {
    return this.settings.list();
  }

  @Put(':key')
  @Roles(UserRole.Admin)
  upsert(
    @Param('key') key: string,
    @Body() dto: UpsertSettingDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.settings.upsert(key, dto.value, user);
  }

  @Delete(':key')
  @Roles(UserRole.Admin)
  @HttpCode(204)
  remove(@Param('key') key: string, @CurrentUser() user: AuthUser) {
    return this.settings.remove(key, user);
  }
}
