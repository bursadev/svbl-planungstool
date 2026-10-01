import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Demand } from './demand.entity.js';
import { PlanningRun } from './planning-run.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([PlanningRun, Demand])],
  exports: [TypeOrmModule],
})
export class PlanningModule {}
