import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemModule } from '../system/system.module.js';
import { Demand } from './demand.entity.js';
import { PlanningRun } from './planning-run.entity.js';
import { SnapshotService } from './snapshot.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([PlanningRun, Demand]), SystemModule],
  providers: [SnapshotService],
  exports: [TypeOrmModule, SnapshotService],
})
export class PlanningModule {}
