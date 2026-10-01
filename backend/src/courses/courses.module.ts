import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from './assignment.entity.js';
import { CourseDay } from './course-day.entity.js';
import { CourseTypeCertificate } from './course-type-certificate.entity.js';
import { CourseTypeDevice } from './course-type-device.entity.js';
import { CourseTypeSkill } from './course-type-skill.entity.js';
import { CourseType } from './course-type.entity.js';
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
    ]),
  ],
  exports: [TypeOrmModule],
})
export class CoursesModule {}
