import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseType } from '../courses/course-type.entity.js';
import { SystemModule } from '../system/system.module.js';
import { Availability } from './availability.entity.js';
import { CertificateTypeMaintenanceCourseType } from './certificate-type-maintenance-course-type.entity.js';
import { CertificateType } from './certificate-type.entity.js';
import { CertificateTypesController } from './certificate-types.controller.js';
import { CertificateTypesService } from './certificate-types.service.js';
import { InstructorCertificate } from './instructor-certificate.entity.js';
import { InstructorSkill } from './instructor-skill.entity.js';
import { Instructor } from './instructor.entity.js';
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
      // Read-only here: the maintenance rule links certificate types to course types.
      CourseType,
    ]),
    SystemModule,
  ],
  controllers: [SkillsController, CertificateTypesController],
  providers: [SkillsService, CertificateTypesService],
  exports: [TypeOrmModule, SkillsService, CertificateTypesService],
})
export class InstructorsModule {}
