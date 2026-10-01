import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  type Relation,
} from 'typeorm';
import { Customer } from '../customers/customer.entity.js';
import { BaseEntity } from '../database/base.entity.js';
import {
  LANGUAGE_ENUM,
  LOCATION_KIND_ENUM,
  Language,
  LocationKind,
} from '../database/enums.js';
import { Room } from './room.entity.js';

/** Standort: one of the training centres or an external customer site. */
@Entity()
export class Location extends BaseEntity {
  @Column({ type: 'text', unique: true })
  code: string;

  @Column('text')
  name: string;

  @Column({ type: 'enum', enum: LocationKind, enumName: LOCATION_KIND_ENUM })
  kind: LocationKind;

  @Column({ type: 'text', nullable: true })
  addressLine: string | null;

  @Column({ type: 'text', nullable: true })
  postalCode: string | null;

  @Column({ type: 'text', nullable: true })
  city: string | null;

  @Column({ type: 'text', nullable: true })
  canton: string | null;

  @Column({ type: 'enum', enum: Language, enumName: LANGUAGE_ENUM })
  languageRegion: Language;

  /** Whether inter-company courses (ÜK) run here; 5 of the 11 centres do. */
  @Column({ type: 'boolean', default: false })
  hostsUk: boolean;

  /** How many courses can run in parallel; `freeSlot` checks it per week. */
  @Column({ type: 'smallint', default: 1 })
  parallelCourseCapacity: number;

  @Column({ type: 'text', nullable: true })
  contactName: string | null;

  @Column({ type: 'text', nullable: true })
  contactEmail: string | null;

  @Column({ type: 'text', nullable: true })
  contactPhone: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  /** Set for customer sites: the customer the site belongs to. */
  @Column({ type: 'uuid', nullable: true })
  customerId: string | null;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_id' })
  customer: Relation<Customer> | null;

  @OneToMany(() => Room, (room) => room.location)
  rooms: Relation<Room>[];
}
