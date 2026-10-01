import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type { AuthUser } from '../auth/clerk-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Roles, WRITE_ROLES } from '../auth/roles.decorator.js';
import { uuidPipe } from '../common/uuid.pipe.js';
import { DevicesService } from './devices.service.js';
import {
  CreateDeviceDto,
  CreateDeviceMoveDto,
  CreateMaintenanceWindowDto,
  ListDevicesQuery,
  UpdateDeviceDto,
  UpdateMaintenanceWindowDto,
} from './dto/device.dto.js';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Get()
  list(@Query() query: ListDevicesQuery) {
    return this.devices.list(query);
  }

  @Get(':id')
  get(@Param('id', uuidPipe) id: string) {
    return this.devices.get(id);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  create(@Body() dto: CreateDeviceDto, @CurrentUser() user: AuthUser) {
    return this.devices.create(dto, user);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  update(
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateDeviceDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.devices.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @HttpCode(204)
  remove(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.devices.remove(id, user);
  }

  @Get(':id/moves')
  async listMoves(@Param('id', uuidPipe) id: string) {
    return (await this.devices.get(id)).moves;
  }

  @Post(':id/moves')
  @Roles(...WRITE_ROLES)
  addMove(
    @Param('id', uuidPipe) id: string,
    @Body() dto: CreateDeviceMoveDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.devices.addMove(id, dto, user);
  }

  @Get(':id/maintenance-windows')
  async listMaintenanceWindows(@Param('id', uuidPipe) id: string) {
    return (await this.devices.get(id)).maintenanceWindows;
  }

  @Post(':id/maintenance-windows')
  @Roles(...WRITE_ROLES)
  addMaintenanceWindow(
    @Param('id', uuidPipe) id: string,
    @Body() dto: CreateMaintenanceWindowDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.devices.addMaintenanceWindow(id, dto, user);
  }
}

@Controller('device-moves')
export class DeviceMovesController {
  constructor(private readonly devices: DevicesService) {}

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @HttpCode(204)
  remove(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.devices.removeMove(id, user);
  }
}

@Controller('maintenance-windows')
export class MaintenanceWindowsController {
  constructor(private readonly devices: DevicesService) {}

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  update(
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateMaintenanceWindowDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.devices.updateMaintenanceWindow(id, dto, user);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @HttpCode(204)
  remove(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.devices.removeMaintenanceWindow(id, user);
  }
}
