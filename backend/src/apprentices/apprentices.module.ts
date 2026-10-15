import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from '../locations/location.entity.js';
import { SystemModule } from '../system/system.module.js';
import { Apprentice } from './apprentice.entity.js';
import {
  ApprenticesController,
  SchoolClassesController,
  SchoolHolidaysController,
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
import {
  TrainersController,
  TrainingCompaniesController,
} from './training-companies.controller.js';
import { TrainingCompaniesService } from './training-companies.service.js';
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
    SchoolHolidaysController,
    TrainingCompaniesController,
    TrainersController,
    ApprenticesController,
  ],
  providers: [SchoolsService, ApprenticesService, TrainingCompaniesService],
  exports: [TypeOrmModule, SchoolsService, ApprenticesService],
})
export class ApprenticesModule {}
