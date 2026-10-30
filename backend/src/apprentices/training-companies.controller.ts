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
import {
  CreateTrainerDto,
  CreateTrainingCompanyDto,
  ListTrainingCompaniesQuery,
  UpdateTrainerDto,
  UpdateTrainingCompanyDto,
} from './dto/training-company.dto.js';
import { TrainingCompaniesService } from './training-companies.service.js';
import { TRAINING_COMPANIES_TABULAR } from './training-companies.tabular.js';

@Controller('training-companies')
export class TrainingCompaniesController {
  constructor(
    private readonly companies: TrainingCompaniesService,
    private readonly ds: DataSource,
  ) {}

  @Get()
  async list(
    @Query() query: ListTrainingCompaniesQuery,
    @Res({ passthrough: true }) res: Response,
  ) {
    return sendPage(res, await this.companies.list(query));
  }

  // The fixed paths come before `:id`, which only accepts UUIDs.

  /** All companies matching the list filters (no paging) as CSV. */
  @Get('export.csv')
  async exportCsv(@Query() query: ListTrainingCompaniesQuery) {
    const { items } = await this.companies.list(
      Object.assign(query, { page: undefined }),
    );
    return csvFile(
      datedName(TRAINING_COMPANIES_TABULAR.fileName),
      exportCsv(TRAINING_COMPANIES_TABULAR.columns, items),
    );
  }

  @Get('import-template.csv')
  template() {
    return csvFile(
      `${TRAINING_COMPANIES_TABULAR.fileName}-vorlage`,
      templateCsv(TRAINING_COMPANIES_TABULAR.columns),
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
    return runCsvImport(this.ds, TRAINING_COMPANIES_TABULAR, dto.csv, {
      dryRun: isDryRun(dryRun),
      actorUserId: user.dbUserId,
    });
  }

  @Post('bulk')
  @Roles(...WRITE_ROLES)
  @HttpCode(200)
  bulk(@Body() dto: BulkActionDto, @CurrentUser() user: AuthUser) {
    return runBulk(this.ds, TRAINING_COMPANIES_TABULAR, dto, user.dbUserId);
  }

  @Get(':id')
  get(@Param('id', uuidPipe) id: string) {
    return this.companies.get(id);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  create(@Body() dto: CreateTrainingCompanyDto, @CurrentUser() user: AuthUser) {
    return this.companies.create(dto, user);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  update(
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateTrainingCompanyDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.companies.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @HttpCode(204)
  remove(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.companies.remove(id, user);
  }

  @Post(':id/trainers')
  @Roles(...WRITE_ROLES)
  createTrainer(
    @Param('id', uuidPipe) id: string,
    @Body() dto: CreateTrainerDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.companies.createTrainer(id, dto, user);
  }
}

@Controller('trainers')
export class TrainersController {
  constructor(private readonly companies: TrainingCompaniesService) {}

  @Get()
  list(@Query('q') q?: string) {
    return this.companies.listTrainers(q?.trim() || undefined);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  update(
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateTrainerDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.companies.updateTrainer(id, dto, user);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @HttpCode(204)
  remove(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.companies.removeTrainer(id, user);
  }
}
