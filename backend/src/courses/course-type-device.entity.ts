import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { Timestamps } from '../database/base.entity.js';
import { DeviceType } from '../devices/device-type.entity.js';
import { CourseType } from './course-type.entity.js';

/** Devices (Geräte) of one type a course type (Kurstyp) needs, with how many. */
@Entity()
@Check('"quantity" > 0')
export class CourseTypeDevice extends Timestamps {
  @PrimaryColumn('uuid')
  courseTypeId: string;

  @ManyToOne(() => CourseType, (courseType) => courseType.requiredDevices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'course_type_id' })
  courseType: Relation<CourseType>;

  @PrimaryColumn('uuid')
  deviceTypeId: string;

  @ManyToOne(() => DeviceType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'device_type_id' })
  deviceType: Relation<DeviceType>;

  @Column('smallint')
  quantity: number;
}
