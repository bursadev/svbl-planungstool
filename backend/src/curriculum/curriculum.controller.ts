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
import { DataSource } from 'typeorm';
import type { AuthUser } from '../auth/clerk-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Roles, WRITE_ROLES } from '../auth/roles.decorator.js';
import { BulkActionDto, runBulk } from '../common/bulk.js';
import { runCsvImport } from '../common/csv-import.js';
import { CsvImportDto, isDryRun } from '../common/list-query.js';
import {
  csvFile,
  datedName,
  exportCsv,
  templateCsv,
} from '../common/tabular.js';
import { uuidPipe } from '../common/uuid.pipe.js';
import { CurriculumService } from './curriculum.service.js';
import { TIME_WINDOWS_TABULAR } from './time-windows.tabular.js';
import {
  CreateCohortDto,
  CreateCurriculumModuleDto,
  CreateTimeWindowDto,
  ListModulesQuery,
  ListTimeWindowsQuery,
  UpdateCohortDto,
  UpdateCurriculumModuleDto,
  UpdateTimeWindowDto,
} from './dto/curriculum.dto.js';

@Controller('curriculum-modules')
export class CurriculumModulesController {
  constructor(private readonly curriculum: CurriculumService) {}

  @Get()
  list(@Query() query: ListModulesQuery) {
    return this.curriculum.listModules(query);
  }

  @Get(':id')
  get(@Param('id', uuidPipe) id: string) {
    return this.curriculum.getModule(id);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  create(
    @Body() dto: CreateCurriculumModuleDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.curriculum.createModule(dto, user);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  update(
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateCurriculumModuleDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.curriculum.updateModule(id, dto, user);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @HttpCode(204)
  remove(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.curriculum.removeModule(id, user);
  }
}

@Controller('cohorts')
export class CohortsController {
  constructor(private readonly curriculum: CurriculumService) {}

  @Get()
  list() {
    return this.curriculum.listCohorts();
  }

  @Post()
  @Roles(...WRITE_ROLES)
  create(@Body() dto: CreateCohortDto, @CurrentUser() user: AuthUser) {
    return this.curriculum.createCohort(dto, user);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  update(
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateCohortDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.curriculum.updateCohort(id, dto, user);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @HttpCode(204)
  remove(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.curriculum.removeCohort(id, user);
  }
}

@Controller('time-windows')
export class TimeWindowsController {
  constructor(
    private readonly curriculum: CurriculumService,
    private readonly ds: DataSource,
  ) {}

  @Get()
  list(@Query() query: ListTimeWindowsQuery) {
    return this.curriculum.listTimeWindows(query);
  }

  // The fixed paths come before `:id`, which only accepts UUIDs.

  /** All time windows, or those of one cohort (`?cohortId=`), as CSV. */
  @Get('export.csv')
  async exportCsv(@Query() query: ListTimeWindowsQuery) {
    return csvFile(
      datedName(TIME_WINDOWS_TABULAR.fileName),
      exportCsv(
        TIME_WINDOWS_TABULAR.columns,
        await this.curriculum.listTimeWindows(query),
      ),
    );
  }

  @Get('import-template.csv')
  template() {
    return csvFile(
      `${TIME_WINDOWS_TABULAR.fileName}-vorlage`,
      templateCsv(TIME_WINDOWS_TABULAR.columns),
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
    return runCsvImport(this.ds, TIME_WINDOWS_TABULAR, dto.csv, {
      dryRun: isDryRun(dryRun),
      actorUserId: user.dbUserId,
    });
  }

  @Post('bulk')
  @Roles(...WRITE_ROLES)
  @HttpCode(200)
  bulk(@Body() dto: BulkActionDto, @CurrentUser() user: AuthUser) {
    return runBulk(this.ds, TIME_WINDOWS_TABULAR, dto, user.dbUserId);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  create(@Body() dto: CreateTimeWindowDto, @CurrentUser() user: AuthUser) {
    return this.curriculum.createTimeWindow(dto, user);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  update(
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateTimeWindowDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.curriculum.updateTimeWindow(id, dto, user);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @HttpCode(204)
  remove(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.curriculum.removeTimeWindow(id, user);
  }
}
