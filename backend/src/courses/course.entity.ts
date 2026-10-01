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
import { Enrollment } from '../apprentices/enrollment.entity.js';
import { Cohort } from '../curriculum/cohort.entity.js';
import { TimeWindow } from '../curriculum/time-window.entity.js';
import { BaseEntity } from '../database/base.entity.js';
import {
  COURSE_STATUS_ENUM,
  CourseStatus,
  LANGUAGE_ENUM,
  Language,
} from '../database/enums.js';
import { Location } from '../locations/location.entity.js';
import { Demand } from '../planning/demand.entity.js';
import { PlanningRun } from '../planning/planning-run.entity.js';
import { User } from '../users/user.entity.js';
import { Assignment } from './assignment.entity.js';
import { CourseDay } from './course-day.entity.js';
import { CourseType } from './course-type.entity.js';

/**
 * Kurs, Durchführung: a scheduled instance of a course type. Start and end
 * are derived from its days (`min/max(course_day.held_on)`).
 */
@Entity()
@Index(['locationId'])
@Index(['courseTypeId'])
@Index(['status'])
@Index(['cohortId'])
@Check('"capacity" > 0')
export class Course extends BaseEntity {
  @Column('uuid')
  courseTypeId: string;

  @ManyToOne(() => CourseType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'course_type_id' })
  courseType: Relation<CourseType>;

  @Column('uuid')
  locationId: string;

  @ManyToOne(() => Location, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'location_id' })
  location: Relation<Location>;

  @Column({ type: 'enum', enum: Language, enumName: LANGUAGE_ENUM })
  language: Language;

  @Column({ type: 'uuid', nullable: true })
  cohortId: string | null;

  @ManyToOne(() => Cohort, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cohort_id' })
  cohort: Relation<Cohort> | null;

  /** Set for ÜK courses: every ÜK course lies inside a time window. */
  @Column({ type: 'uuid', nullable: true })
  timeWindowId: string | null;

  @ManyToOne(() => TimeWindow, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'time_window_id' })
  timeWindow: Relation<TimeWindow> | null;

  @Column({ type: 'uuid', nullable: true })
  demandId: string | null;

  @ManyToOne(() => Demand, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'demand_id' })
  demand: Relation<Demand> | null;

  @Column({ type: 'uuid', nullable: true })
  planningRunId: string | null;

  @ManyToOne(() => PlanningRun, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'planning_run_id' })
  planningRun: Relation<PlanningRun> | null;

  @Column('smallint')
  capacity: number;

  @Column({
    type: 'enum',
    enum: CourseStatus,
    enumName: COURSE_STATUS_ENUM,
    default: CourseStatus.Planned,
  })
  status: CourseStatus;

  @Column({ type: 'boolean', default: false })
  published: boolean;

  @Column({ type: 'text', nullable: true })
  planningIssue: string | null;

  /** Reference of the course in OdAOrg. */
  @Column({ type: 'text', nullable: true })
  externalRef: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'uuid', nullable: true })
  createdByUserId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser: Relation<User> | null;

  @OneToMany(() => CourseDay, (d) => d.course)
  days: Relation<CourseDay>[];

  @OneToMany(() => Assignment, (a) => a.course)
  assignments: Relation<Assignment>[];

  @OneToMany(() => Enrollment, (e) => e.course)
  enrollments: Relation<Enrollment>[];
}
