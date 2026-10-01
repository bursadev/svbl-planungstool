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
} from '@nestjs/common';
import type { AuthUser } from '../auth/clerk-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Roles, WRITE_ROLES } from '../auth/roles.decorator.js';
import { uuidPipe } from '../common/uuid.pipe.js';
import { CourseTypesService } from './course-types.service.js';
import {
  CreateCourseTypeDto,
  ReplaceRequirementsDto,
  UpdateCourseTypeDto,
} from './dto/course-type.dto.js';

@Controller('course-types')
export class CourseTypesController {
  constructor(private readonly types: CourseTypesService) {}

  @Get()
  list() {
    return this.types.list();
  }

  @Get(':id')
  get(@Param('id', uuidPipe) id: string) {
    return this.types.get(id);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  create(@Body() dto: CreateCourseTypeDto, @CurrentUser() user: AuthUser) {
    return this.types.create(dto, user);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  update(
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateCourseTypeDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.types.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @HttpCode(204)
  remove(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.types.remove(id, user);
  }

  @Put(':id/requirements')
  @Roles(...WRITE_ROLES)
  replaceRequirements(
    @Param('id', uuidPipe) id: string,
    @Body() dto: ReplaceRequirementsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.types.replaceRequirements(id, dto, user);
  }
}
