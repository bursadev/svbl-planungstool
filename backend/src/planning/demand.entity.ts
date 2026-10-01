import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';
import { CourseType } from '../courses/course-type.entity.js';
import { Cohort } from '../curriculum/cohort.entity.js';
import { CurriculumModule } from '../curriculum/curriculum-module.entity.js';
import { TimeWindow } from '../curriculum/time-window.entity.js';
import { BaseEntity } from '../database/base.entity.js';
import {
  DEMAND_SOURCE_ENUM,
  DEMAND_STATUS_ENUM,
  DemandSource,
  DemandStatus,
} from '../database/enums.js';
import { Location } from '../locations/location.entity.js';
import { PlanningRun } from './planning-run.entity.js';

/**
 * Bedarf: how many courses of a type are needed where and when; the first
 * step of a planning run, generated from cohorts or entered by Sales.
 */
@Entity()
@Check('"participant_count" >= 0')
@Check('"courses_needed" >= 0')
@Check('"school_weekday" IS NULL OR "school_weekday" BETWEEN 1 AND 7')
@Index(['planningRunId'])
@Index(['locationId'])
export class Demand extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  planningRunId: string | null;

  @ManyToOne(() => PlanningRun, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'planning_run_id' })
  planningRun: Relation<PlanningRun> | null;

  @Column({ type: 'uuid', nullable: true })
  cohortId: string | null;

  @ManyToOne(() => Cohort, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cohort_id' })
  cohort: Relation<Cohort> | null;

  @Column({ type: 'uuid', nullable: true })
  curriculumModuleId: string | null;

  @ManyToOne(() => CurriculumModule, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'curriculum_module_id' })
  curriculumModule: Relation<CurriculumModule> | null;

  @Column('uuid')
  courseTypeId: string;

  @ManyToOne(() => CourseType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'course_type_id' })
  courseType: Relation<CourseType>;

  @Column({ type: 'uuid', nullable: true })
  timeWindowId: string | null;

  @ManyToOne(() => TimeWindow, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'time_window_id' })
  timeWindow: Relation<TimeWindow> | null;

  @Column('uuid')
  locationId: string;

  @ManyToOne(() => Location, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'location_id' })
  location: Relation<Location>;

  /** ISO weekday (Monday = 1) the apprentices are at school; `freeSlot` avoids it. */
  @Column({ type: 'smallint', nullable: true })
  schoolWeekday: number | null;

  @Column('integer')
  participantCount: number;

  /** ceil(participant_count / course_type.max_participants), set by `genDemand`. */
  @Column('smallint')
  coursesNeeded: number;

  @Column({ type: 'enum', enum: DemandSource, enumName: DEMAND_SOURCE_ENUM })
  source: DemandSource;

  @Column({
    type: 'enum',
    enum: DemandStatus,
    enumName: DEMAND_STATUS_ENUM,
    default: DemandStatus.Open,
  })
  status: DemandStatus;

  @Column({ type: 'text', nullable: true })
  note: string | null;
}
