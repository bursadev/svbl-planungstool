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
import { ApprenticesService } from './apprentices.service.js';
import { APPRENTICES_TABULAR } from './apprentices.tabular.js';
import { ListApprenticesQuery } from './dto/apprentice.dto.js';
import {
  CreateSchoolClassDto,
  CreateSchoolHolidayDto,
  CreateVocationalSchoolDto,
  ListVocationalSchoolsQuery,
  ReplaceSchoolClassDaysDto,
  UpdateSchoolClassDto,
  UpdateSchoolHolidayDto,
  UpdateVocationalSchoolDto,
} from './dto/school.dto.js';
import { SchoolsService } from './schools.service.js';
import { SCHOOLS_TABULAR } from './schools.tabular.js';

@Controller('vocational-schools')
export class VocationalSchoolsController {
  constructor(
    private readonly schools: SchoolsService,
    private readonly ds: DataSource,
  ) {}

  @Get()
  async list(
    @Query() query: ListVocationalSchoolsQuery,
    @Res({ passthrough: true }) res: Response,
  ) {
    return sendPage(res, await this.schools.list(query));
  }

  // The fixed paths come before `:id`, which only accepts UUIDs.

  /** All schools matching the list filters (no paging) as CSV. */
  @Get('export.csv')
  async exportCsv(@Query() query: ListVocationalSchoolsQuery) {
    const { items } = await this.schools.list(
      Object.assign(query, { page: undefined }),
    );
    return csvFile(
      datedName(SCHOOLS_TABULAR.fileName),
      exportCsv(SCHOOLS_TABULAR.columns, items),
    );
  }

  @Get('import-template.csv')
  template() {
    return csvFile(
      `${SCHOOLS_TABULAR.fileName}-vorlage`,
      templateCsv(SCHOOLS_TABULAR.columns),
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
    return runCsvImport(this.ds, SCHOOLS_TABULAR, dto.csv, {
      dryRun: isDryRun(dryRun),
      actorUserId: user.dbUserId,
    });
  }

  @Post('bulk')
  @Roles(...WRITE_ROLES)
  @HttpCode(200)
  bulk(@Body() dto: BulkActionDto, @CurrentUser() user: AuthUser) {
    return runBulk(this.ds, SCHOOLS_TABULAR, dto, user.dbUserId);
  }

  @Get(':id')
  get(@Param('id', uuidPipe) id: string) {
    return this.schools.get(id);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  create(
    @Body() dto: CreateVocationalSchoolDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.schools.create(dto, user);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  update(
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateVocationalSchoolDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.schools.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @HttpCode(204)
  remove(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.schools.remove(id, user);
  }

  @Get(':id/classes')
  async listClasses(@Param('id', uuidPipe) id: string) {
    return (await this.schools.get(id)).classes;
  }

  @Post(':id/classes')
  @Roles(...WRITE_ROLES)
  createClass(
    @Param('id', uuidPipe) id: string,
    @Body() dto: CreateSchoolClassDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.schools.createClass(id, dto, user);
  }

  @Get(':id/holidays')
  listHolidays(@Param('id', uuidPipe) id: string) {
    return this.schools.listHolidays(id);
  }

  @Post(':id/holidays')
  @Roles(...WRITE_ROLES)
  createHoliday(
    @Param('id', uuidPipe) id: string,
    @Body() dto: CreateSchoolHolidayDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.schools.createHoliday(id, dto, user);
  }
}

@Controller('school-holidays')
export class SchoolHolidaysController {
  constructor(private readonly schools: SchoolsService) {}

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  update(
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateSchoolHolidayDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.schools.updateHoliday(id, dto, user);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @HttpCode(204)
  remove(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.schools.removeHoliday(id, user);
  }
}

@Controller('school-classes')
export class SchoolClassesController {
  constructor(private readonly schools: SchoolsService) {}

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  update(
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateSchoolClassDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.schools.updateClass(id, dto, user);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @HttpCode(204)
  remove(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.schools.removeClass(id, user);
  }

  @Put(':id/days')
  @Roles(...WRITE_ROLES)
  replaceDays(
    @Param('id', uuidPipe) id: string,
    @Body() dto: ReplaceSchoolClassDaysDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.schools.replaceClassDays(id, dto, user);
  }
}

@Controller('apprentices')
export class ApprenticesController {
  constructor(private readonly apprentices: ApprenticesService) {}

  @Get()
  async list(
    @Query() query: ListApprenticesQuery,
    @Res({ passthrough: true }) res: Response,
  ) {
    return sendPage(res, await this.apprentices.list(query));
  }

  // Export only: the school export is the source, so no template, import or bulk.

  /** All Lernende matching the list filters (no paging) as CSV, without the AHV number. */
  @Get('export.csv')
  async exportCsv(@Query() query: ListApprenticesQuery) {
    const { items } = await this.apprentices.query(
      Object.assign(query, { page: undefined }),
    );
    return csvFile(
      datedName(APPRENTICES_TABULAR.fileName),
      exportCsv(APPRENTICES_TABULAR.columns, items),
    );
  }

  @Get(':id')
  get(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.apprentices.get(id, user);
  }
}
