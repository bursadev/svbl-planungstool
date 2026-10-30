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
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { DataSource } from 'typeorm';
import type { AuthUser } from '../auth/clerk-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Roles, WRITE_ROLES } from '../auth/roles.decorator.js';
import { BulkActionDto, runBulk } from '../common/bulk.js';
import { runCsvImport } from '../common/csv-import.js';
import { CsvImportDto, isDryRun, sendPage } from '../common/list-query.js';
import {
  csvFile,
  datedName,
  exportCsv,
  templateCsv,
} from '../common/tabular.js';
import { uuidPipe } from '../common/uuid.pipe.js';
import { DevicesService } from './devices.service.js';
import { DEVICES_TABULAR } from './devices.tabular.js';
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
  constructor(
    private readonly devices: DevicesService,
    private readonly ds: DataSource,
  ) {}

  @Get()
  async list(
    @Query() query: ListDevicesQuery,
    @Res({ passthrough: true }) res: Response,
  ) {
    return sendPage(res, await this.devices.list(query));
  }

  // The fixed paths come before `:id`, which only accepts UUIDs.

  /** All devices matching the list filters (no paging) as CSV. */
  @Get('export.csv')
  async exportCsv(@Query() query: ListDevicesQuery) {
    const { items } = await this.devices.list(
      Object.assign(query, { page: undefined }),
    );
    return csvFile(
      datedName(DEVICES_TABULAR.fileName),
      exportCsv(DEVICES_TABULAR.columns, items),
    );
  }

  @Get('import-template.csv')
  template() {
    return csvFile(
      `${DEVICES_TABULAR.fileName}-vorlage`,
      templateCsv(DEVICES_TABULAR.columns),
    );
  }

  @Post('import')
  @Roles(...WRITE_ROLES)
  @HttpCode(200)
  import(
    @Body() dto: CsvImportDto,
    @Query('dryRun') dryRun: string | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    return runCsvImport(this.ds, DEVICES_TABULAR, dto.csv, {
      dryRun: isDryRun(dryRun),
      actorUserId: user.dbUserId,
    });
  }

  @Post('bulk')
  @Roles(...WRITE_ROLES)
  @HttpCode(200)
  bulk(@Body() dto: BulkActionDto, @CurrentUser() user: AuthUser) {
    return runBulk(this.ds, DEVICES_TABULAR, dto, user.dbUserId);
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
