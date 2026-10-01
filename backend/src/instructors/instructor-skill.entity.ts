import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { Timestamps } from '../database/base.entity.js';
import { Instructor } from './instructor.entity.js';
import { Skill } from './skill.entity.js';

/** Link table: a skill an instructor holds, with level and since when. */
@Entity()
export class InstructorSkill extends Timestamps {
  @PrimaryColumn('uuid')
  instructorId: string;

  @ManyToOne(() => Instructor, (instructor) => instructor.skills, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'instructor_id' })
  instructor: Relation<Instructor>;

  @PrimaryColumn('uuid')
  skillId: string;

  @ManyToOne(() => Skill, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'skill_id' })
  skill: Relation<Skill>;

  @Column({ type: 'smallint', nullable: true })
  level: number | null;

  @Column({ type: 'date', nullable: true })
  since: string | null;
}
