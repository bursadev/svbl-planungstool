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
import { SchoolClass } from './school-class.entity.js';

/** Schultag: a weekday on which a school class is at school in a given school year. */
@Entity()
@Unique(['schoolClassId', 'schoolYearStart', 'weekday'])
@Check('"weekday" BETWEEN 1 AND 7')
export class SchoolClassDay extends BaseEntity {
  @Column('uuid')
  schoolClassId: string;

  @ManyToOne(() => SchoolClass, (schoolClass) => schoolClass.days, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'school_class_id' })
  schoolClass: Relation<SchoolClass>;

  /** Calendar year the school year starts in: 2026 for 2026/27. */
  @Column('smallint')
  schoolYearStart: number;

  /** ISO weekday, Monday = 1. */
  @Column('smallint')
  weekday: number;

  @Column({ type: 'boolean', default: false })
  evening: boolean;
}
