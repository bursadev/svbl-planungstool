import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { Timestamps } from '../database/base.entity.js';
import { Skill } from '../instructors/skill.entity.js';
import { CourseType } from './course-type.entity.js';

/** Skill (Qualifikation) an instructor needs to teach a course type (Kurstyp). */
@Entity()
export class CourseTypeSkill extends Timestamps {
  @PrimaryColumn('uuid')
  courseTypeId: string;

  @ManyToOne(() => CourseType, (courseType) => courseType.requiredSkills, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'course_type_id' })
  courseType: Relation<CourseType>;

  @PrimaryColumn('uuid')
  skillId: string;

  @ManyToOne(() => Skill, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'skill_id' })
  skill: Relation<Skill>;
}
