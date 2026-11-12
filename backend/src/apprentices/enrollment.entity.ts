import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
  type Relation,
} from 'typeorm';
import { Course } from '../courses/course.entity.js';
import { BaseEntity } from '../database/base.entity.js';
import {
  ENROLLMENT_CHANNEL_ENUM,
  ENROLLMENT_STATUS_ENUM,
  EnrollmentChannel,
  EnrollmentStatus,
} from '../database/enums.js';
import { User } from '../users/user.entity.js';
import { Apprentice } from './apprentice.entity.js';
import { Attendance } from './attendance.entity.js';

/** Kursanmeldung: an apprentice booked into a course; a no-show gets a follow-up enrollment. */
@Entity()
@Unique(['courseId', 'apprenticeId'])
@Index(['apprenticeId'])
@Index(['courseId'])
export class Enrollment extends BaseEntity {
  @Column('uuid')
  courseId: string;

  @ManyToOne(() => Course, (course) => course.enrollments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'course_id' })
  course: Relation<Course>;

  @Column('uuid')
  apprenticeId: string;

  @ManyToOne(() => Apprentice, (apprentice) => apprentice.enrollments, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'apprentice_id' })
  apprentice: Relation<Apprentice>;

  @Column({
    type: 'enum',
    enum: EnrollmentStatus,
    enumName: ENROLLMENT_STATUS_ENUM,
    default: EnrollmentStatus.Registered,
  })
  status: EnrollmentStatus;

  @Column({
    type: 'enum',
    enum: EnrollmentChannel,
    enumName: ENROLLMENT_CHANNEL_ENUM,
    default: EnrollmentChannel.Planner,
  })
  enrolledVia: EnrollmentChannel;

  @Column({ type: 'uuid', nullable: true })
  enrolledByUserId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'enrolled_by_user_id' })
  enrolledByUser: Relation<User> | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  enrolledAt: Date;

  /** Set on the replacement created after a no-show or cancellation. */
  @Column({ type: 'uuid', nullable: true })
  followUpOfEnrollmentId: string | null;

  @ManyToOne(() => Enrollment, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'follow_up_of_enrollment_id' })
  followUpOfEnrollment: Relation<Enrollment> | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => Attendance, (attendance) => attendance.enrollment)
  attendances: Relation<Attendance>[];
}
