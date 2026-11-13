import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
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
  LANGUAGE_ENUM,
  Language,
} from '../database/enums.js';
import { Location } from '../locations/location.entity.js';
import { DemandApprentice } from './demand-apprentice.entity.js';
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

  /** Language of the group's courses (the apprentices' language). */
  @Column({ type: 'enum', enum: Language, enumName: LANGUAGE_ENUM })
  language: Language;

  /** First ISO weekday (Monday = 1) the apprentices are at school; the pill in the UI. */
  @Column({ type: 'smallint', nullable: true })
  schoolWeekday: number | null;

  /** All ISO weekdays the group is at school; the slot search keeps them free. */
  @Column({ type: 'smallint', array: true, default: '{}' })
  blockedWeekdays: number[];

  /** Free seats of existing courses counted against the group (planning spec, decision 1). */
  @Column({ type: 'smallint', default: 0 })
  existingFreeSeats: number;

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

  @OneToMany(() => DemandApprentice, (member) => member.demand)
  members: Relation<DemandApprentice>[];
}
