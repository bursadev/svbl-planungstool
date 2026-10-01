import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import type { AuthUser } from '../auth/clerk-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Roles, WRITE_ROLES } from '../auth/roles.decorator.js';
import { uuidPipe } from '../common/uuid.pipe.js';
import { DeviceTypesService } from './device-types.service.js';
import {
  CreateDeviceTypeDto,
  ReplaceQualificationsDto,
  UpdateDeviceTypeDto,
} from './dto/device-type.dto.js';

@Controller('device-types')
export class DeviceTypesController {
  constructor(private readonly types: DeviceTypesService) {}

  @Get()
  list() {
    return this.types.list();
  }

  @Get(':id')
  get(@Param('id', uuidPipe) id: string) {
    return this.types.get(id);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  create(@Body() dto: CreateDeviceTypeDto, @CurrentUser() user: AuthUser) {
    return this.types.create(dto, user);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  update(
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateDeviceTypeDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.types.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @HttpCode(204)
  remove(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.types.remove(id, user);
  }

  @Put(':id/qualifications')
  @Roles(...WRITE_ROLES)
  replaceQualifications(
    @Param('id', uuidPipe) id: string,
    @Body() dto: ReplaceQualificationsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.types.replaceQualifications(
      id,
      dto.certificateTypeIds,
      dto.skillIds,
      user,
    );
  }
}
