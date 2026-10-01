import { Column, Entity, Unique } from 'typeorm';
import { BaseEntity } from '../database/base.entity.js';
import { TRACK_ENUM, Track } from '../database/enums.js';

/** Jahrgang: apprentices of one track who started in the same year. */
@Entity()
@Unique(['track', 'startYear'])
export class Cohort extends BaseEntity {
  @Column({ type: 'enum', enum: Track, enumName: TRACK_ENUM })
  track: Track;

  @Column('smallint')
  startYear: number;

  @Column('text')
  label: string;

  @Column({ type: 'smallint', nullable: true })
  expectedEndYear: number | null;
}
