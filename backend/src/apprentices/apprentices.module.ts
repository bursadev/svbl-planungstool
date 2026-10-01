import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from '../locations/location.entity.js';
import { SystemModule } from '../system/system.module.js';
import { Apprentice } from './apprentice.entity.js';
import {
  ApprenticesController,
  SchoolClassesController,
  VocationalSchoolsController,
} from './apprentices.controller.js';
import { ApprenticesService } from './apprentices.service.js';
import { Attendance } from './attendance.entity.js';
import { Enrollment } from './enrollment.entity.js';
import { SchoolClassDay } from './school-class-day.entity.js';
import { SchoolClass } from './school-class.entity.js';
import { SchoolHoliday } from './school-holiday.entity.js';
import { SchoolsService } from './schools.service.js';
import { Trainer } from './trainer.entity.js';
import { TrainingCompany } from './training-company.entity.js';
import { VocationalSchool } from './vocational-school.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VocationalSchool,
      SchoolHoliday,
      SchoolClass,
      SchoolClassDay,
      TrainingCompany,
      Trainer,
      Apprentice,
      Enrollment,
      Attendance,
      // Read-only here: reference validation.
      Location,
    ]),
    SystemModule,
  ],
  controllers: [
    VocationalSchoolsController,
    SchoolClassesController,
    ApprenticesController,
  ],
  providers: [SchoolsService, ApprenticesService],
  exports: [TypeOrmModule, SchoolsService, ApprenticesService],
})
export class ApprenticesModule {}
