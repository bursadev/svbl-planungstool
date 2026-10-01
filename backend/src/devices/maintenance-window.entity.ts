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
import { Device } from './device.entity.js';

/** Wartungsfenster: a period in which a device is out of service. */
@Entity()
@Index(['deviceId', 'startsOn', 'endsOn'])
@Check('"starts_on" <= "ends_on"')
export class MaintenanceWindow extends BaseEntity {
  @Column('uuid')
  deviceId: string;

  @ManyToOne(() => Device, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device: Relation<Device>;

  @Column('date')
  startsOn: string;

  @Column('date')
  endsOn: string;

  @Column({ type: 'text', nullable: true })
  note: string | null;
}
