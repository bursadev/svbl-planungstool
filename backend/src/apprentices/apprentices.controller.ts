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
} from '@nestjs/common';
import type { AuthUser } from '../auth/clerk-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Roles, WRITE_ROLES } from '../auth/roles.decorator.js';
import { uuidPipe } from '../common/uuid.pipe.js';
import { ApprenticesService } from './apprentices.service.js';
import { ListApprenticesQuery } from './dto/apprentice.dto.js';
import {
  CreateSchoolClassDto,
  CreateSchoolHolidayDto,
  CreateVocationalSchoolDto,
  ReplaceSchoolClassDaysDto,
  UpdateSchoolClassDto,
  UpdateSchoolHolidayDto,
  UpdateVocationalSchoolDto,
} from './dto/school.dto.js';
import { SchoolsService } from './schools.service.js';

@Controller('vocational-schools')
export class VocationalSchoolsController {
  constructor(private readonly schools: SchoolsService) {}

  @Get()
  list() {
    return this.schools.list();
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
  list(@Query() query: ListApprenticesQuery) {
    return this.apprentices.list(query);
  }

  @Get(':id')
  get(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.apprentices.get(id, user);
  }
}
