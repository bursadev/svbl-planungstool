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
import {
  CreateAvailabilityDto,
  UpdateAvailabilityDto,
} from './dto/availability.dto.js';
import {
  CreateInstructorCertificateDto,
  UpdateInstructorCertificateDto,
} from './dto/instructor-certificate.dto.js';
import {
  CreateInstructorDto,
  ListInstructorsQuery,
  ReplaceSkillsDto,
  UpdateInstructorDto,
} from './dto/instructor.dto.js';
import { InstructorsService } from './instructors.service.js';
import { INSTRUCTORS_TABULAR } from './instructors.tabular.js';

@Controller('instructors')
export class InstructorsController {
  constructor(
    private readonly instructors: InstructorsService,
    private readonly ds: DataSource,
  ) {}

  @Get()
  async list(
    @Query() query: ListInstructorsQuery,
    @Res({ passthrough: true }) res: Response,
  ) {
    return sendPage(res, await this.instructors.list(query));
  }

  // The fixed paths come before `:id`, which only accepts UUIDs.

  /** All instructors matching the list filters (no paging) as CSV. */
  @Get('export.csv')
  async exportCsv(@Query() query: ListInstructorsQuery) {
    const { items } = await this.instructors.list(
      Object.assign(query, { page: undefined }),
    );
    return csvFile(
      datedName(INSTRUCTORS_TABULAR.fileName),
      exportCsv(INSTRUCTORS_TABULAR.columns, items),
    );
  }

  @Get('import-template.csv')
  template() {
    return csvFile(
      `${INSTRUCTORS_TABULAR.fileName}-vorlage`,
      templateCsv(INSTRUCTORS_TABULAR.columns),
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
    return runCsvImport(this.ds, INSTRUCTORS_TABULAR, dto.csv, {
      dryRun: isDryRun(dryRun),
      actorUserId: user.dbUserId,
    });
  }

  @Post('bulk')
  @Roles(...WRITE_ROLES)
  @HttpCode(200)
  bulk(@Body() dto: BulkActionDto, @CurrentUser() user: AuthUser) {
    return runBulk(this.ds, INSTRUCTORS_TABULAR, dto, user.dbUserId);
  }

  @Get(':id')
  get(@Param('id', uuidPipe) id: string) {
    return this.instructors.get(id);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  create(@Body() dto: CreateInstructorDto, @CurrentUser() user: AuthUser) {
    return this.instructors.create(dto, user);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  update(
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateInstructorDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.instructors.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @HttpCode(204)
  remove(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.instructors.remove(id, user);
  }

  @Put(':id/skills')
  @Roles(...WRITE_ROLES)
  replaceSkills(
    @Param('id', uuidPipe) id: string,
    @Body() dto: ReplaceSkillsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.instructors.replaceSkills(id, dto.skillIds, user);
  }

  @Get(':id/certificates')
  async listCertificates(@Param('id', uuidPipe) id: string) {
    return (await this.instructors.get(id)).certificates;
  }

  @Post(':id/certificates')
  @Roles(...WRITE_ROLES)
  addCertificate(
    @Param('id', uuidPipe) id: string,
    @Body() dto: CreateInstructorCertificateDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.instructors.addCertificate(id, dto, user);
  }

  @Get(':id/availabilities')
  async listAvailabilities(@Param('id', uuidPipe) id: string) {
    return (await this.instructors.get(id)).availabilities;
  }

  @Post(':id/availabilities')
  @Roles(...WRITE_ROLES)
  addAvailability(
    @Param('id', uuidPipe) id: string,
    @Body() dto: CreateAvailabilityDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.instructors.addAvailability(id, dto, user);
  }
}

@Controller('instructor-certificates')
export class InstructorCertificatesController {
  constructor(private readonly instructors: InstructorsService) {}

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  update(
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateInstructorCertificateDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.instructors.updateCertificate(id, dto, user);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @HttpCode(204)
  remove(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.instructors.removeCertificate(id, user);
  }
}

@Controller('availabilities')
export class AvailabilitiesController {
  constructor(private readonly instructors: InstructorsService) {}

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  update(
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateAvailabilityDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.instructors.updateAvailability(id, dto, user);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @HttpCode(204)
  remove(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.instructors.removeAvailability(id, user);
  }

  @Post(':id/approve')
  @Roles(...WRITE_ROLES)
  @HttpCode(200)
  approve(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.instructors.decideAvailability(id, 'approve', user);
  }

  @Post(':id/reject')
  @Roles(...WRITE_ROLES)
  @HttpCode(200)
  reject(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.instructors.decideAvailability(id, 'reject', user);
  }
}
