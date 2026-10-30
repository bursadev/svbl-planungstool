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
import { UpsertLocationDistanceDto } from './dto/location-distance.dto.js';
import {
  CreateLocationDto,
  ListLocationsQuery,
  UpdateLocationDto,
} from './dto/location.dto.js';
import { CreateRoomDto, UpdateRoomDto } from './dto/room.dto.js';
import { LocationsService } from './locations.service.js';
import { LOCATIONS_TABULAR } from './locations.tabular.js';

@Controller('locations')
export class LocationsController {
  constructor(
    private readonly locations: LocationsService,
    private readonly ds: DataSource,
  ) {}

  @Get()
  async list(
    @Query() query: ListLocationsQuery,
    @Res({ passthrough: true }) res: Response,
  ) {
    return sendPage(res, await this.locations.list(query));
  }

  // The fixed paths come before `:id`, which only accepts UUIDs.

  @Get('cantons')
  cantons() {
    return this.locations.cantons();
  }

  /** All locations matching the list filters (no paging) as CSV. */
  @Get('export.csv')
  async exportCsv(@Query() query: ListLocationsQuery) {
    const { items } = await this.locations.list(
      Object.assign(query, { page: undefined }),
    );
    return csvFile(
      datedName(LOCATIONS_TABULAR.fileName),
      exportCsv(LOCATIONS_TABULAR.columns, items),
    );
  }

  @Get('import-template.csv')
  template() {
    return csvFile(
      `${LOCATIONS_TABULAR.fileName}-vorlage`,
      templateCsv(LOCATIONS_TABULAR.columns),
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
    return runCsvImport(this.ds, LOCATIONS_TABULAR, dto.csv, {
      dryRun: isDryRun(dryRun),
      actorUserId: user.dbUserId,
    });
  }

  @Post('bulk')
  @Roles(...WRITE_ROLES)
  @HttpCode(200)
  bulk(@Body() dto: BulkActionDto, @CurrentUser() user: AuthUser) {
    return runBulk(this.ds, LOCATIONS_TABULAR, dto, user.dbUserId);
  }

  @Get(':id')
  get(@Param('id', uuidPipe) id: string) {
    return this.locations.get(id);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  create(@Body() dto: CreateLocationDto, @CurrentUser() user: AuthUser) {
    return this.locations.create(dto, user);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  update(
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateLocationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.locations.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @HttpCode(204)
  remove(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.locations.remove(id, user);
  }

  @Get(':id/rooms')
  listRooms(@Param('id', uuidPipe) id: string) {
    return this.locations.listRooms(id);
  }

  @Post(':id/rooms')
  @Roles(...WRITE_ROLES)
  createRoom(
    @Param('id', uuidPipe) id: string,
    @Body() dto: CreateRoomDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.locations.createRoom(id, dto, user);
  }
}

@Controller('location-distances')
export class LocationDistancesController {
  constructor(private readonly locations: LocationsService) {}

  @Get()
  list() {
    return this.locations.listDistances();
  }

  @Put()
  @Roles(...WRITE_ROLES)
  set(@Body() dto: UpsertLocationDistanceDto, @CurrentUser() user: AuthUser) {
    return this.locations.setDistance(dto, user);
  }

  @Delete(':fromId/:toId')
  @Roles(...WRITE_ROLES)
  @HttpCode(204)
  remove(
    @Param('fromId', uuidPipe) fromId: string,
    @Param('toId', uuidPipe) toId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.locations.removeDistance(fromId, toId, user);
  }
}

@Controller('rooms')
export class RoomsController {
  constructor(private readonly locations: LocationsService) {}

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  update(
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateRoomDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.locations.updateRoom(id, dto, user);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @HttpCode(204)
  remove(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.locations.removeRoom(id, user);
  }
}
