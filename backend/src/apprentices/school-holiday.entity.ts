import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../database/base.entity.js';
import { VocationalSchool } from './vocational-school.entity.js';

/** Schulferien: a holiday period of one vocational school; no school days fall inside it. */
@Entity()
@Check('"starts_on" <= "ends_on"')
export class SchoolHoliday extends BaseEntity {
  @Column('uuid')
  vocationalSchoolId: string;

  @ManyToOne(() => VocationalSchool, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vocational_school_id' })
  vocationalSchool: Relation<VocationalSchool>;

  @Column('date')
  startsOn: string;

  @Column('date')
  endsOn: string;

  @Column({ type: 'text', nullable: true })
  name: string | null;
}
