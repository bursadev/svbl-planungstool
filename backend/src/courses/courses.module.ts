import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurriculumModule } from '../curriculum/curriculum-module.entity.js';
import { DeviceType } from '../devices/device-type.entity.js';
import { CertificateType } from '../instructors/certificate-type.entity.js';
import { Skill } from '../instructors/skill.entity.js';
import { SystemModule } from '../system/system.module.js';
import { Assignment } from './assignment.entity.js';
import { CourseDay } from './course-day.entity.js';
import { CourseTypeCertificate } from './course-type-certificate.entity.js';
import { CourseTypeDevice } from './course-type-device.entity.js';
import { CourseTypeSkill } from './course-type-skill.entity.js';
import { CourseType } from './course-type.entity.js';
import { CourseTypesController } from './course-types.controller.js';
import { CourseTypesService } from './course-types.service.js';
import { Course } from './course.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CourseType,
      CourseTypeSkill,
      CourseTypeCertificate,
      CourseTypeDevice,
      Course,
      CourseDay,
      Assignment,
      // Read-only here: requirement validation and the curriculum slot of a course type.
      Skill,
      CertificateType,
      DeviceType,
      CurriculumModule,
    ]),
    SystemModule,
  ],
  controllers: [CourseTypesController],
  providers: [CourseTypesService],
  exports: [TypeOrmModule, CourseTypesService],
})
export class CoursesModule {}
