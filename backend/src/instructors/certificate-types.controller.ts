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
import { CertificateTypesService } from './certificate-types.service.js';
import {
  CreateCertificateTypeDto,
  ReplaceMaintenanceCourseTypesDto,
  UpdateCertificateTypeDto,
} from './dto/certificate-type.dto.js';

@Controller('certificate-types')
export class CertificateTypesController {
  constructor(private readonly types: CertificateTypesService) {}

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
  create(@Body() dto: CreateCertificateTypeDto, @CurrentUser() user: AuthUser) {
    return this.types.create(dto, user);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  update(
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateCertificateTypeDto,
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

  @Put(':id/maintenance-course-types')
  @Roles(...WRITE_ROLES)
  replaceMaintenanceCourseTypes(
    @Param('id', uuidPipe) id: string,
    @Body() dto: ReplaceMaintenanceCourseTypesDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.types.replaceMaintenanceCourseTypes(
      id,
      dto.courseTypeIds,
      user,
    );
  }
}
