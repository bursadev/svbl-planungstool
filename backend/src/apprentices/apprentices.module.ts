import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Apprentice } from './apprentice.entity.js';
import { Attendance } from './attendance.entity.js';
import { Enrollment } from './enrollment.entity.js';
import { SchoolClassDay } from './school-class-day.entity.js';
import { SchoolClass } from './school-class.entity.js';
import { SchoolHoliday } from './school-holiday.entity.js';
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
    ]),
  ],
  exports: [TypeOrmModule],
})
export class ApprenticesModule {}
