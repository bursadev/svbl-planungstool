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
  CreateSkillDto,
  ListSkillsQuery,
  UpdateSkillDto,
} from './dto/skill.dto.js';
import { SkillsService } from './skills.service.js';
import { SKILLS_TABULAR } from './skills.tabular.js';

@Controller('skills')
export class SkillsController {
  constructor(
    private readonly skills: SkillsService,
    private readonly ds: DataSource,
  ) {}

  @Get()
  async list(
    @Query() query: ListSkillsQuery,
    @Res({ passthrough: true }) res: Response,
  ) {
    return sendPage(res, await this.skills.list(query));
  }

  // The fixed paths come before `:id`, which only accepts UUIDs.

  /** All skills matching the list filters (no paging) as CSV. */
  @Get('export.csv')
  async exportCsv(@Query() query: ListSkillsQuery) {
    const { items } = await this.skills.list(
      Object.assign(query, { page: undefined }),
    );
    return csvFile(
      datedName(SKILLS_TABULAR.fileName),
      exportCsv(SKILLS_TABULAR.columns, items),
    );
  }

  @Get('import-template.csv')
  template() {
    return csvFile(
      `${SKILLS_TABULAR.fileName}-vorlage`,
      templateCsv(SKILLS_TABULAR.columns),
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
    return runCsvImport(this.ds, SKILLS_TABULAR, dto.csv, {
      dryRun: isDryRun(dryRun),
      actorUserId: user.dbUserId,
    });
  }

  @Post('bulk')
  @Roles(...WRITE_ROLES)
  @HttpCode(200)
  bulk(@Body() dto: BulkActionDto, @CurrentUser() user: AuthUser) {
    return runBulk(this.ds, SKILLS_TABULAR, dto, user.dbUserId);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  create(@Body() dto: CreateSkillDto, @CurrentUser() user: AuthUser) {
    return this.skills.create(dto, user);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  update(
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateSkillDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.skills.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @HttpCode(204)
  remove(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.skills.remove(id, user);
  }
}
