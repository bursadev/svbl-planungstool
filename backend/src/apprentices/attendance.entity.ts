import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Unique,
  type Relation,
} from 'typeorm';
import { CourseDay } from '../courses/course-day.entity.js';
import { BaseEntity } from '../database/base.entity.js';
import { ATTENDANCE_STATUS_ENUM, AttendanceStatus } from '../database/enums.js';
import { Enrollment } from './enrollment.entity.js';

/** Anwesenheit: presence of one enrollment on one course day. */
@Entity()
@Unique(['enrollmentId', 'courseDayId'])
export class Attendance extends BaseEntity {
  @Column('uuid')
  enrollmentId: string;

  @ManyToOne(() => Enrollment, (enrollment) => enrollment.attendances, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'enrollment_id' })
  enrollment: Relation<Enrollment>;

  @Column('uuid')
  courseDayId: string;

  @ManyToOne(() => CourseDay, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_day_id' })
  courseDay: Relation<CourseDay>;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    enumName: ATTENDANCE_STATUS_ENUM,
  })
  status: AttendanceStatus;
}
