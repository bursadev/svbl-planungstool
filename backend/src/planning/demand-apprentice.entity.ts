import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { Apprentice } from '../apprentices/apprentice.entity.js';
import { Timestamps } from '../database/base.entity.js';
import { Demand } from './demand.entity.js';

/**
 * Link table: the apprentices a demand group (Bedarf) was computed for, so
 * the course proposal can pack exactly them into the group's courses.
 */
@Entity()
export class DemandApprentice extends Timestamps {
  @PrimaryColumn('uuid')
  demandId: string;

  @ManyToOne(() => Demand, (demand) => demand.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'demand_id' })
  demand: Relation<Demand>;

  @PrimaryColumn('uuid')
  apprenticeId: string;

  @ManyToOne(() => Apprentice, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'apprentice_id' })
  apprentice: Relation<Apprentice>;
}
