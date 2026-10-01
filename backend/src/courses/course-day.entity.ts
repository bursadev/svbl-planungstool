import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../database/base.entity.js';
import { Location } from '../locations/location.entity.js';
import { Room } from '../locations/room.entity.js';
import { Course } from './course.entity.js';

/** Kurstag: one day of a course; days can be non-consecutive and span weeks. */
@Entity()
@Unique(['courseId', 'heldOn'])
@Unique(['courseId', 'sequence'])
@Check('"starts_at" < "ends_at"')
@Index(['heldOn'])
@Index(['locationId', 'heldOn'])
@Index(['roomId', 'heldOn'])
export class CourseDay extends BaseEntity {
  @Column('uuid')
  courseId: string;

  @ManyToOne(() => Course, (course) => course.days, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Relation<Course>;

  @Column('date')
  heldOn: string;

  @Column('time')
  startsAt: string;

  @Column('time')
  endsAt: string;

  @Column('smallint')
  sequence: number;

  /** Overrides the course's location for this day; null means the course's. */
  @Column({ type: 'uuid', nullable: true })
  locationId: string | null;

  @ManyToOne(() => Location, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'location_id' })
  location: Relation<Location> | null;

  @Column({ type: 'uuid', nullable: true })
  roomId: string | null;

  @ManyToOne(() => Room, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'room_id' })
  room: Relation<Room> | null;
}
