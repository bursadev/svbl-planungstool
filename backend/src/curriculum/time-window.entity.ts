import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../database/base.entity.js';
import { Location } from '../locations/location.entity.js';
import { Cohort } from './cohort.entity.js';
import { CurriculumModule } from './curriculum-module.entity.js';

/**
 * Zeitfenster: the period in which one ÜK module has to run for one cohort.
 * Uniqueness per (module, cohort, location) is NULL-tolerant through the
 * full unique index plus the partial one.
 */
@Entity()
@Index(['curriculumModuleId', 'cohortId', 'locationId'], { unique: true })
@Index(['curriculumModuleId', 'cohortId'], {
  unique: true,
  where: '"location_id" IS NULL',
})
@Check('"starts_on" <= "ends_on"')
export class TimeWindow extends BaseEntity {
  @Column('uuid')
  curriculumModuleId: string;

  @ManyToOne(() => CurriculumModule, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'curriculum_module_id' })
  curriculumModule: Relation<CurriculumModule>;

  @Column('uuid')
  cohortId: string;

  @ManyToOne(() => Cohort, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cohort_id' })
  cohort: Relation<Cohort>;

  @Column('date')
  startsOn: string;

  @Column('date')
  endsOn: string;

  /** Optional regional split; null means the window applies everywhere. */
  @Column({ type: 'uuid', nullable: true })
  locationId: string | null;

  @ManyToOne(() => Location, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'location_id' })
  location: Relation<Location> | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;
}
