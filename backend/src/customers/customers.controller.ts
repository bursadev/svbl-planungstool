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
import { CustomersService } from './customers.service.js';
import { CUSTOMERS_TABULAR } from './customers.tabular.js';
import {
  CreateCustomerDto,
  ListCustomersQuery,
  UpdateCustomerDto,
} from './dto/customer.dto.js';
import {
  CreateParticipantDto,
  UpdateParticipantDto,
} from './dto/participant.dto.js';
import { ListParticipantsQuery } from './dto/participant-query.dto.js';
import { PARTICIPANTS_TABULAR } from './participants.tabular.js';

@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customers: CustomersService,
    private readonly ds: DataSource,
  ) {}

  @Get()
  async list(
    @Query() query: ListCustomersQuery,
    @Res({ passthrough: true }) res: Response,
  ) {
    return sendPage(res, await this.customers.list(query));
  }

  // The fixed paths come before `:id`, which only accepts UUIDs.

  /** All customers matching the list filters (no paging) as CSV. */
  @Get('export.csv')
  async exportCsv(@Query() query: ListCustomersQuery) {
    const { items } = await this.customers.list(
      Object.assign(query, { page: undefined }),
    );
    return csvFile(
      datedName(CUSTOMERS_TABULAR.fileName),
      exportCsv(CUSTOMERS_TABULAR.columns, items),
    );
  }

  @Get('import-template.csv')
  template() {
    return csvFile(
      `${CUSTOMERS_TABULAR.fileName}-vorlage`,
      templateCsv(CUSTOMERS_TABULAR.columns),
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
    return runCsvImport(this.ds, CUSTOMERS_TABULAR, dto.csv, {
      dryRun: isDryRun(dryRun),
      actorUserId: user.dbUserId,
    });
  }

  @Post('bulk')
  @Roles(...WRITE_ROLES)
  @HttpCode(200)
  bulk(@Body() dto: BulkActionDto, @CurrentUser() user: AuthUser) {
    return runBulk(this.ds, CUSTOMERS_TABULAR, dto, user.dbUserId);
  }

  @Get(':id')
  get(@Param('id', uuidPipe) id: string) {
    return this.customers.get(id);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  create(@Body() dto: CreateCustomerDto, @CurrentUser() user: AuthUser) {
    return this.customers.create(dto, user);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  update(
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customers.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @HttpCode(204)
  remove(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.customers.remove(id, user);
  }
}

@Controller('participants')
export class ParticipantsController {
  constructor(
    private readonly customers: CustomersService,
    private readonly ds: DataSource,
  ) {}

  @Get()
  async list(
    @Query() query: ListParticipantsQuery,
    @Res({ passthrough: true }) res: Response,
  ) {
    return sendPage(res, await this.customers.listParticipants(query));
  }

  // The fixed paths come before `:id`, which only accepts UUIDs.

  /** All participants matching the list filters (no paging) as CSV. */
  @Get('export.csv')
  async exportCsv(@Query() query: ListParticipantsQuery) {
    const { items } = await this.customers.listParticipants(
      Object.assign(query, { page: undefined }),
    );
    return csvFile(
      datedName(PARTICIPANTS_TABULAR.fileName),
      exportCsv(PARTICIPANTS_TABULAR.columns, items),
    );
  }

  @Get('import-template.csv')
  template() {
    return csvFile(
      `${PARTICIPANTS_TABULAR.fileName}-vorlage`,
      templateCsv(PARTICIPANTS_TABULAR.columns),
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
    return runCsvImport(this.ds, PARTICIPANTS_TABULAR, dto.csv, {
      dryRun: isDryRun(dryRun),
      actorUserId: user.dbUserId,
    });
  }

  @Post('bulk')
  @Roles(...WRITE_ROLES)
  @HttpCode(200)
  bulk(@Body() dto: BulkActionDto, @CurrentUser() user: AuthUser) {
    return runBulk(this.ds, PARTICIPANTS_TABULAR, dto, user.dbUserId);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  create(@Body() dto: CreateParticipantDto, @CurrentUser() user: AuthUser) {
    return this.customers.createParticipant(dto, user);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  update(
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateParticipantDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customers.updateParticipant(id, dto, user);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @HttpCode(204)
  remove(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.customers.removeParticipant(id, user);
  }
}
