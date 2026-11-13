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
import { ApplyFixDto, CreatePlanningRunDto } from './dto/planning-run.dto.js';
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

  /** Stage 1: (re)generates the demand groups; later drafts of the run are dropped. */
  @Post(':id/demand')
  @Roles(...WRITE_ROLES)
  @HttpCode(200)
  generateDemand(
    @Param('id', uuidPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.runs.generateDemand(id, user);
  }

  @Get(':id/demand')
  listDemand(@Param('id', uuidPipe) id: string) {
    return this.runs.listDemand(id);
  }

  /** Stage 2: proposes dates, rooms and the apprentices' seats for every demand group. */
  @Post(':id/courses')
  @Roles(...WRITE_ROLES)
  @HttpCode(200)
  proposeCourses(
    @Param('id', uuidPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.runs.proposeCourses(id, user);
  }

  @Get(':id/courses')
  listRunCourses(@Param('id', uuidPipe) id: string) {
    return this.runs.listRunCourses(id);
  }

  /** Stage 3: proposes an instructor for every placed draft course. */
  @Post(':id/staffing')
  @Roles(...WRITE_ROLES)
  @HttpCode(200)
  staffRun(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.runs.staffRun(id, user);
  }

  /** Stage 4: every open issue of the run with its reason. */
  @Get(':id/issues')
  listIssues(@Param('id', uuidPipe) id: string) {
    return this.runs.listIssues(id);
  }

  @Get(':id/courses/:courseId/fix-options')
  fixOptions(
    @Param('id', uuidPipe) id: string,
    @Param('courseId', uuidPipe) courseId: string,
  ) {
    return this.runs.fixOptionsFor(id, courseId);
  }

  @Post(':id/courses/:courseId/fix')
  @Roles(...WRITE_ROLES)
  @HttpCode(200)
  applyFix(
    @Param('id', uuidPipe) id: string,
    @Param('courseId', uuidPipe) courseId: string,
    @Body() dto: ApplyFixDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.runs.applyFix(id, courseId, dto.option, user);
  }

  @Get(':id/summary')
  summary(@Param('id', uuidPipe) id: string) {
    return this.runs.summary(id);
  }

  /** Commits the run in one transaction: placed drafts become planned courses. */
  @Post(':id/commit')
  @Roles(...WRITE_ROLES)
  @HttpCode(200)
  commit(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.runs.commit(id, user);
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
