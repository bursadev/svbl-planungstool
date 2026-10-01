import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../database/base.entity.js';
import {
  DEVICE_MOBILITY_ENUM,
  DEVICE_STATUS_ENUM,
  DeviceMobility,
  DeviceStatus,
} from '../database/enums.js';
import { Location } from '../locations/location.entity.js';
import { DeviceType } from './device-type.entity.js';

/** Gerät: one physical machine (forklift, aerial platform, crane) with its home location. */
@Entity()
@Check(
  '"rental_from" IS NULL OR "rental_until" IS NULL OR "rental_from" <= "rental_until"',
)
export class Device extends BaseEntity {
  @Column('uuid')
  deviceTypeId: string;

  @ManyToOne(() => DeviceType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'device_type_id' })
  deviceType: Relation<DeviceType>;

  @Column({ type: 'text', unique: true })
  inventoryNumber: string;

  /** Where the device is unless a `DeviceMove` says otherwise; see `deviceAt`. */
  @Column('uuid')
  homeLocationId: string;

  @ManyToOne(() => Location, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'home_location_id' })
  homeLocation: Relation<Location>;

  @Column({
    type: 'enum',
    enum: DeviceMobility,
    enumName: DEVICE_MOBILITY_ENUM,
    default: DeviceMobility.Fixed,
  })
  mobility: DeviceMobility;

  @Column({
    type: 'enum',
    enum: DeviceStatus,
    enumName: DEVICE_STATUS_ENUM,
    default: DeviceStatus.Available,
  })
  status: DeviceStatus;

  /** Rental devices are only available inside [rental_from, rental_until]. */
  @Column({ type: 'date', nullable: true })
  rentalFrom: string | null;

  @Column({ type: 'date', nullable: true })
  rentalUntil: string | null;

  @Column({ type: 'text', nullable: true })
  rentalVendor: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
