import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enrollment } from '../apprentices/enrollment.entity.js';
import { Assignment } from '../courses/assignment.entity.js';
import { CourseDay } from '../courses/course-day.entity.js';
import { Course } from '../courses/course.entity.js';
import { Instructor } from '../instructors/instructor.entity.js';
import { SystemModule } from '../system/system.module.js';
import {
  AssignmentsController,
  CoursesController,
} from './courses.controller.js';
import { CoursesService } from './courses.service.js';
import { DemandApprentice } from './demand-apprentice.entity.js';
import { Demand } from './demand.entity.js';
import { PlanningRun } from './planning-run.entity.js';
import { SnapshotService } from './snapshot.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlanningRun,
      Demand,
      DemandApprentice,
      Course,
      CourseDay,
      Assignment,
      Enrollment,
      Instructor,
    ]),
    SystemModule,
  ],
  controllers: [CoursesController, AssignmentsController],
  providers: [SnapshotService, CoursesService],
  exports: [TypeOrmModule, SnapshotService, CoursesService],
})
export class PlanningModule {}
