import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Unique,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../database/base.entity.js';
import { Location } from './location.entity.js';

/** Travel time between two locations; feeds the travel soft constraint. */
@Entity()
@Unique(['fromLocationId', 'toLocationId'])
@Check('"from_location_id" <> "to_location_id"')
export class LocationDistance extends BaseEntity {
  @Column('uuid')
  fromLocationId: string;

  @ManyToOne(() => Location, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'from_location_id' })
  fromLocation: Relation<Location>;

  @Column('uuid')
  toLocationId: string;

  @ManyToOne(() => Location, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'to_location_id' })
  toLocation: Relation<Location>;

  @Column('smallint')
  travelMinutes: number;
}
