import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Unique,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../database/base.entity.js';
import { ROOM_KIND_ENUM, RoomKind } from '../database/enums.js';
import { Location } from './location.entity.js';

/** Raum: a theory room, practice hall or outdoor area at a location. */
@Entity()
@Unique(['locationId', 'name'])
export class Room extends BaseEntity {
  @Column('uuid')
  locationId: string;

  @ManyToOne(() => Location, (location) => location.rooms, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'location_id' })
  location: Relation<Location>;

  @Column('text')
  name: string;

  @Column({ type: 'enum', enum: RoomKind, enumName: ROOM_KIND_ENUM })
  kind: RoomKind;

  @Column({ type: 'smallint', nullable: true })
  capacity: number | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;
}
