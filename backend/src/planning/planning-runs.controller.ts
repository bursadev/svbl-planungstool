import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import type { AuthUser } from '../auth/clerk-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Roles, WRITE_ROLES } from '../auth/roles.decorator.js';
import { uuidPipe } from '../common/uuid.pipe.js';
import { CreatePlanningRunDto } from './dto/planning-run.dto.js';
import { PlanningRunsService } from './planning-runs.service.js';

@Controller('planning-runs')
export class PlanningRunsController {
  constructor(private readonly runs: PlanningRunsService) {}

  @Get()
  list() {
    return this.runs.list();
  }

  @Post()
  @Roles(...WRITE_ROLES)
  create(@Body() dto: CreatePlanningRunDto, @CurrentUser() user: AuthUser) {
    return this.runs.create(dto, user);
  }

  @Get(':id')
  get(@Param('id', uuidPipe) id: string) {
    return this.runs.get(id);
  }

  /** Discards a draft run with all its drafts; a committed run is a 409. */
  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @HttpCode(204)
  discard(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.runs.discard(id, user);
  }
}

@Controller('planning')
export class PlanningController {
  constructor(private readonly runs: PlanningRunsService) {}

  /** The intake numbers of the Planungslauf overview. */
  @Get('overview')
  overview() {
    return this.runs.overview();
  }
}
