import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cohort } from './cohort.entity.js';
import { CurriculumModulePrerequisite } from './curriculum-module-prerequisite.entity.js';
import { CurriculumModule } from './curriculum-module.entity.js';
import { TimeWindow } from './time-window.entity.js';

/** Named `CurriculumDomainModule` so it does not clash with the `CurriculumModule` entity. */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      CurriculumModule,
      CurriculumModulePrerequisite,
      Cohort,
      TimeWindow,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class CurriculumDomainModule {}
