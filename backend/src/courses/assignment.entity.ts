import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../database/base.entity.js';
import {
  ASSIGNMENT_ROLE_ENUM,
  ASSIGNMENT_STATUS_ENUM,
  AssignmentRole,
  AssignmentStatus,
} from '../database/enums.js';
import { Instructor } from '../instructors/instructor.entity.js';
import { User } from '../users/user.entity.js';
import { Course } from './course.entity.js';
import { CourseDay } from './course-day.entity.js';

/** Snapshot of the feasibility check taken when the assignment was created. */
export interface AssignmentCheckResult {
  ok: boolean;
  hard: { label: string; ok: boolean; reason: string }[];
  soft: { text: string; delta: number }[];
  score: number;
}

/**
 * Einsatz, Zuweisung: an instructor on a course, or on a single course day
 * for partial staffing. Uniqueness per (course, instructor, day) is
 * NULL-tolerant through the full unique index plus the partial one.
 */
@Entity()
@Index(['courseId', 'instructorId', 'courseDayId'], { unique: true })
@Index(['courseId', 'instructorId'], {
  unique: true,
  where: '"course_day_id" IS NULL',
})
@Index(['instructorId'])
@Index(['status'])
export class Assignment extends BaseEntity {
  @Column('uuid')
  courseId: string;

  @ManyToOne(() => Course, (course) => course.assignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'course_id' })
  course: Relation<Course>;

  /** Set for partial staffing: the assignment covers only this day. */
  @Column({ type: 'uuid', nullable: true })
  courseDayId: string | null;

  @ManyToOne(() => CourseDay, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_day_id' })
  courseDay: Relation<CourseDay> | null;

  @Column('uuid')
  instructorId: string;

  @ManyToOne(() => Instructor, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'instructor_id' })
  instructor: Relation<Instructor>;

  @Column({
    type: 'enum',
    enum: AssignmentRole,
    enumName: ASSIGNMENT_ROLE_ENUM,
    default: AssignmentRole.Lead,
  })
  role: AssignmentRole;

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    enumName: ASSIGNMENT_STATUS_ENUM,
    default: AssignmentStatus.Proposed,
  })
  status: AssignmentStatus;

  /** The reasons snapshot the AI assistant cites. */
  @Column({ type: 'jsonb', nullable: true })
  checkResult: AssignmentCheckResult | null;

  @Column({ type: 'smallint', nullable: true })
  score: number | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  overtimeHours: string | null;

  @Column({ type: 'uuid', nullable: true })
  confirmedByUserId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'confirmed_by_user_id' })
  confirmedByUser: Relation<User> | null;

  @Column({ type: 'timestamptz', nullable: true })
  confirmedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;
}
