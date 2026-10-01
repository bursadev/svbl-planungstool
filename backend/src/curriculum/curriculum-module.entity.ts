import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Unique,
  type Relation,
} from 'typeorm';
import { CourseType } from '../courses/course-type.entity.js';
import { BaseEntity } from '../database/base.entity.js';
import { TRACK_ENUM, Track } from '../database/enums.js';

/** ÜK-Modul: one inter-company course in the training plan (Bildungsplan) of a track. */
@Entity()
@Unique(['track', 'sequence'])
@Check('"semester" BETWEEN 1 AND 6')
export class CurriculumModule extends BaseEntity {
  @Column({ type: 'enum', enum: Track, enumName: TRACK_ENUM })
  track: Track;

  /** An ÜK course type is taught as exactly one curriculum module. */
  @Column({ type: 'uuid', unique: true })
  courseTypeId: string;

  @ManyToOne(() => CourseType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'course_type_id' })
  courseType: Relation<CourseType>;

  /** Fixed by the training plan (hard); the timing inside it is flexible. */
  @Column('smallint')
  semester: number;

  @Column('smallint')
  sequence: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;
}
