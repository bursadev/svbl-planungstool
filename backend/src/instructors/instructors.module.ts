import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseType } from '../courses/course-type.entity.js';
import { Location } from '../locations/location.entity.js';
import { SystemModule } from '../system/system.module.js';
import { Availability } from './availability.entity.js';
import { CertificateTypeMaintenanceCourseType } from './certificate-type-maintenance-course-type.entity.js';
import { CertificateType } from './certificate-type.entity.js';
import { CertificateTypesController } from './certificate-types.controller.js';
import { CertificateTypesService } from './certificate-types.service.js';
import { InstructorCertificate } from './instructor-certificate.entity.js';
import { InstructorSkill } from './instructor-skill.entity.js';
import { Instructor } from './instructor.entity.js';
import {
  AvailabilitiesController,
  InstructorCertificatesController,
  InstructorsController,
} from './instructors.controller.js';
import { InstructorsService } from './instructors.service.js';
import { Skill } from './skill.entity.js';
import { SkillsController } from './skills.controller.js';
import { SkillsService } from './skills.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Skill,
      CertificateType,
      CertificateTypeMaintenanceCourseType,
      Instructor,
      InstructorSkill,
      InstructorCertificate,
      Availability,
      // Read-only here: validation of references and the maintenance rule.
      CourseType,
      Location,
    ]),
    SystemModule,
  ],
  controllers: [
    SkillsController,
    CertificateTypesController,
    InstructorsController,
    InstructorCertificatesController,
    AvailabilitiesController,
  ],
  providers: [SkillsService, CertificateTypesService, InstructorsService],
  exports: [
    TypeOrmModule,
    SkillsService,
    CertificateTypesService,
    InstructorsService,
  ],
})
export class InstructorsModule {}
