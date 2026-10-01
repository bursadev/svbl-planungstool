import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
  type Relation,
} from 'typeorm';
import { CourseDay } from '../courses/course-day.entity.js';
import { BaseEntity } from '../database/base.entity.js';
import { Device } from './device.entity.js';

/**
 * Gerätereservation: a device is booked for one course day. Rescheduling a
 * course rewrites its reservations.
 */
@Entity()
@Unique(['deviceId', 'courseDayId'])
@Unique(['deviceId', 'reservedOn'])
@Index(['reservedOn'])
export class DeviceReservation extends BaseEntity {
  @Column('uuid')
  deviceId: string;

  @ManyToOne(() => Device, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'device_id' })
  device: Relation<Device>;

  @Column('uuid')
  courseDayId: string;

  @ManyToOne(() => CourseDay, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_day_id' })
  courseDay: Relation<CourseDay>;

  /** Copied from the course day so the database can enforce one reservation per device and date. */
  @Column('date')
  reservedOn: string;
}
