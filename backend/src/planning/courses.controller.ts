import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { sendPage } from '../common/list-query.js';
import { uuidPipe } from '../common/uuid.pipe.js';
import { CoursesService } from './courses.service.js';
import { ListCoursesQuery } from './dto/course.dto.js';

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
}
