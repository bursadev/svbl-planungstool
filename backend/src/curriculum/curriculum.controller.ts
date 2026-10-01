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
import type { AuthUser } from '../auth/clerk-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Roles, WRITE_ROLES } from '../auth/roles.decorator.js';
import { uuidPipe } from '../common/uuid.pipe.js';
import { CurriculumService } from './curriculum.service.js';
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
  constructor(private readonly curriculum: CurriculumService) {}

  @Get()
  list(@Query() query: ListTimeWindowsQuery) {
    return this.curriculum.listTimeWindows(query);
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
