import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../database/base.entity.js';
import { TRACK_ENUM, Track } from '../database/enums.js';
import { SchoolClassDay } from './school-class-day.entity.js';
import { VocationalSchool } from './vocational-school.entity.js';

/** Schulklasse: a class at a vocational school; its school days block ÜK days for its apprentices. */
@Entity()
@Unique(['vocationalSchoolId', 'code'])
export class SchoolClass extends BaseEntity {
  @Column('uuid')
  vocationalSchoolId: string;

  @ManyToOne(() => VocationalSchool, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vocational_school_id' })
  vocationalSchool: Relation<VocationalSchool>;

  @Column('text')
  code: string;

  @Column({ type: 'enum', enum: Track, enumName: TRACK_ENUM })
  track: Track;

  @Column('smallint')
  startYear: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @OneToMany(() => SchoolClassDay, (day) => day.schoolClass)
  days: Relation<SchoolClassDay>[];
}
