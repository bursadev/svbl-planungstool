import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import type { AuthUser } from '../auth/clerk-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Roles, WRITE_ROLES } from '../auth/roles.decorator.js';
import { sendPage } from '../common/list-query.js';
import { uuidPipe } from '../common/uuid.pipe.js';
import { CoursesService } from './courses.service.js';
import {
  AssignInstructorDto,
  CandidatesQuery,
  ListCoursesQuery,
} from './dto/course.dto.js';

@Controller('courses')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Get()
  async list(
    @Query() query: ListCoursesQuery,
    @Res({ passthrough: true }) res: Response,
  ) {
    return sendPage(res, await this.courses.list(query));
  }

  @Get(':id')
  get(@Param('id', uuidPipe) id: string) {
    return this.courses.get(id);
  }

  /** Instructors ranked by the engine for this course (feasible ones unless `all=true`). */
  @Get(':id/candidates')
  candidates(
    @Param('id', uuidPipe) id: string,
    @Query() query: CandidatesQuery,
  ) {
    return this.courses.candidates(id, query);
  }

  @Get(':id/check/:instructorId')
  check(
    @Param('id', uuidPipe) id: string,
    @Param('instructorId', uuidPipe) instructorId: string,
  ) {
    return this.courses.check(id, instructorId);
  }

  @Post(':id/assignments')
  @Roles(...WRITE_ROLES)
  assign(
    @Param('id', uuidPipe) id: string,
    @Body() dto: AssignInstructorDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.courses.assign(id, dto, user);
  }
}

@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly courses: CoursesService) {}

  @Post(':id/confirm')
  @Roles(...WRITE_ROLES)
  @HttpCode(200)
  confirm(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.courses.confirmAssignment(id, user);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @HttpCode(204)
  remove(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.courses.removeAssignment(id, user);
  }
}
