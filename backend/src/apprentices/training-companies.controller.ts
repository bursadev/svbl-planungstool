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
import {
  CreateTrainerDto,
  CreateTrainingCompanyDto,
  UpdateTrainerDto,
  UpdateTrainingCompanyDto,
} from './dto/training-company.dto.js';
import { TrainingCompaniesService } from './training-companies.service.js';

@Controller('training-companies')
export class TrainingCompaniesController {
  constructor(private readonly companies: TrainingCompaniesService) {}

  @Get()
  list(@Query('q') q?: string) {
    return this.companies.list(q?.trim() || undefined);
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
