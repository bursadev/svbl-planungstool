import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../database/base.entity.js';
import { Location } from '../locations/location.entity.js';
import { Device } from './device.entity.js';

/**
 * Geräteverschiebung: a device changes location on a date. `deviceAt(device,
 * date)` takes the home location, then the last move with effective_on <= date.
 */
@Entity()
@Index(['deviceId', 'effectiveOn'])
export class DeviceMove extends BaseEntity {
  @Column('uuid')
  deviceId: string;

  @ManyToOne(() => Device, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device: Relation<Device>;

  @Column('uuid')
  fromLocationId: string;

  @ManyToOne(() => Location, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'from_location_id' })
  fromLocation: Relation<Location>;

  @Column('uuid')
  toLocationId: string;

  @ManyToOne(() => Location, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'to_location_id' })
  toLocation: Relation<Location>;

  @Column('date')
  effectiveOn: string;

  @Column({ type: 'text', nullable: true })
  note: string | null;
}
