import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseType } from '../courses/course-type.entity.js';
import { Location } from '../locations/location.entity.js';
import { SystemModule } from '../system/system.module.js';
import { Cohort } from './cohort.entity.js';
import { CurriculumModulePrerequisite } from './curriculum-module-prerequisite.entity.js';
import { CurriculumModule } from './curriculum-module.entity.js';
import {
  CohortsController,
  CurriculumModulesController,
  TimeWindowsController,
} from './curriculum.controller.js';
import { CurriculumService } from './curriculum.service.js';
import { TimeWindow } from './time-window.entity.js';

/** Named `CurriculumDomainModule` so it does not clash with the `CurriculumModule` entity. */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      CurriculumModule,
      CurriculumModulePrerequisite,
      Cohort,
      TimeWindow,
      // Read-only here: reference validation.
      CourseType,
      Location,
    ]),
    SystemModule,
  ],
  controllers: [
    CurriculumModulesController,
    CohortsController,
    TimeWindowsController,
  ],
  providers: [CurriculumService],
  exports: [TypeOrmModule, CurriculumService],
})
export class CurriculumDomainModule {}
