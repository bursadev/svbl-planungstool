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
import { CourseTypesService } from './course-types.service.js';
import { COURSE_TYPES_TABULAR } from './course-types.tabular.js';
import {
  CreateCourseTypeDto,
  ListCourseTypesQuery,
  ReplaceRequirementsDto,
  UpdateCourseTypeDto,
} from './dto/course-type.dto.js';

@Controller('course-types')
export class CourseTypesController {
  constructor(
    private readonly types: CourseTypesService,
    private readonly ds: DataSource,
  ) {}

  @Get()
  async list(
    @Query() query: ListCourseTypesQuery,
    @Res({ passthrough: true }) res: Response,
  ) {
    return sendPage(res, await this.types.list(query));
  }

  // The fixed paths come before `:id`, which only accepts UUIDs.

  /** All course types matching the list filters (no paging) as CSV. */
  @Get('export.csv')
  async exportCsv(@Query() query: ListCourseTypesQuery) {
    const { items } = await this.types.list(
      Object.assign(query, { page: undefined }),
    );
    return csvFile(
      datedName(COURSE_TYPES_TABULAR.fileName),
      exportCsv(COURSE_TYPES_TABULAR.columns, items),
    );
  }

  @Get('import-template.csv')
  template() {
    return csvFile(
      `${COURSE_TYPES_TABULAR.fileName}-vorlage`,
      templateCsv(COURSE_TYPES_TABULAR.columns),
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
    return runCsvImport(this.ds, COURSE_TYPES_TABULAR, dto.csv, {
      dryRun: isDryRun(dryRun),
      actorUserId: user.dbUserId,
    });
  }

  @Post('bulk')
  @Roles(...WRITE_ROLES)
  @HttpCode(200)
  bulk(@Body() dto: BulkActionDto, @CurrentUser() user: AuthUser) {
    return runBulk(this.ds, COURSE_TYPES_TABULAR, dto, user.dbUserId);
  }

  @Get(':id')
  get(@Param('id', uuidPipe) id: string) {
    return this.types.get(id);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  create(@Body() dto: CreateCourseTypeDto, @CurrentUser() user: AuthUser) {
    return this.types.create(dto, user);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  update(
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateCourseTypeDto,
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

  @Put(':id/requirements')
  @Roles(...WRITE_ROLES)
  replaceRequirements(
    @Param('id', uuidPipe) id: string,
    @Body() dto: ReplaceRequirementsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.types.replaceRequirements(id, dto, user);
  }
}
