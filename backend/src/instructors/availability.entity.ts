import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../database/base.entity.js';
import {
  AVAILABILITY_KIND_ENUM,
  AVAILABILITY_SOURCE_ENUM,
  AVAILABILITY_STATUS_ENUM,
  AvailabilityKind,
  AvailabilitySource,
  AvailabilityStatus,
} from '../database/enums.js';
import { User } from '../users/user.entity.js';
import { Instructor } from './instructor.entity.js';

/**
 * Verfügbarkeit: a period in an instructor's calendar. `vacation` starts as
 * `requested` and needs planner approval; other kinds are `approved` on
 * creation; `available` is the positive declaration of freelancers.
 * "Assigned" periods are derived from assignments, not stored here.
 */
@Entity()
@Check('"starts_on" <= "ends_on"')
@Index(['instructorId', 'startsOn', 'endsOn'])
export class Availability extends BaseEntity {
  @Column('uuid')
  instructorId: string;

  @ManyToOne(() => Instructor, (instructor) => instructor.availabilities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'instructor_id' })
  instructor: Relation<Instructor>;

  @Column('date')
  startsOn: string;

  @Column('date')
  endsOn: string;

  @Column({
    type: 'enum',
    enum: AvailabilityKind,
    enumName: AVAILABILITY_KIND_ENUM,
  })
  kind: AvailabilityKind;

  @Column({
    type: 'enum',
    enum: AvailabilityStatus,
    enumName: AVAILABILITY_STATUS_ENUM,
  })
  status: AvailabilityStatus;

  @Column({
    type: 'enum',
    enum: AvailabilitySource,
    enumName: AVAILABILITY_SOURCE_ENUM,
    default: AvailabilitySource.Manual,
  })
  source: AvailabilitySource;

  @Column({ type: 'uuid', nullable: true })
  requestedByUserId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'requested_by_user_id' })
  requestedByUser: Relation<User> | null;

  @Column({ type: 'uuid', nullable: true })
  decidedByUserId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'decided_by_user_id' })
  decidedByUser: Relation<User> | null;

  @Column({ type: 'timestamptz', nullable: true })
  decidedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;
}
