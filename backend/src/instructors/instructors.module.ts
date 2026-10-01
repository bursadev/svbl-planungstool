import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Availability } from './availability.entity.js';
import { CertificateTypeMaintenanceCourseType } from './certificate-type-maintenance-course-type.entity.js';
import { CertificateType } from './certificate-type.entity.js';
import { InstructorCertificate } from './instructor-certificate.entity.js';
import { InstructorSkill } from './instructor-skill.entity.js';
import { Instructor } from './instructor.entity.js';
import { Skill } from './skill.entity.js';

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
    ]),
  ],
  exports: [TypeOrmModule],
})
export class InstructorsModule {}
