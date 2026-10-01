import { Check, Column, Entity, OneToMany, type Relation } from 'typeorm';
import { BaseEntity } from '../database/base.entity.js';
import {
  COURSE_KIND_ENUM,
  CourseKind,
  LANGUAGE_ENUM,
  Language,
  TRACK_ENUM,
  Track,
  WEEKDAY_RULE_ENUM,
  WeekdayRule,
} from '../database/enums.js';
import { CourseTypeCertificate } from './course-type-certificate.entity.js';
import { CourseTypeDevice } from './course-type-device.entity.js';
import { CourseTypeSkill } from './course-type-skill.entity.js';

/** Kurstyp: the template that says what a course is; instantiated by courses. */
@Entity()
@Check('"duration_days" > 0')
@Check('"max_participants" > 0')
export class CourseType extends BaseEntity {
  @Column({ type: 'text', unique: true })
  code: string;

  @Column('text')
  name: string;

  @Column({ type: 'enum', enum: CourseKind, enumName: COURSE_KIND_ENUM })
  kind: CourseKind;

  /** Null for course types that are not an ÜK (adult and exam courses). */
  @Column({ type: 'enum', enum: Track, enumName: TRACK_ENUM, nullable: true })
  track: Track | null;

  @Column('smallint')
  durationDays: number;

  @Column({ type: 'boolean', default: false })
  maySpanWeeks: boolean;

  @Column({
    type: 'enum',
    enum: WeekdayRule,
    enumName: WEEKDAY_RULE_ENUM,
    default: WeekdayRule.Weekdays,
  })
  weekdayRule: WeekdayRule;

  @Column({
    type: 'enum',
    enum: Language,
    enumName: LANGUAGE_ENUM,
    array: true,
  })
  languages: Language[];

  @Column({ type: 'smallint', nullable: true })
  minParticipants: number | null;

  @Column('smallint')
  maxParticipants: number;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: false })
  published: boolean;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @OneToMany(() => CourseTypeSkill, (x) => x.courseType)
  requiredSkills: Relation<CourseTypeSkill>[];

  @OneToMany(() => CourseTypeCertificate, (x) => x.courseType)
  requiredCertificates: Relation<CourseTypeCertificate>[];

  @OneToMany(() => CourseTypeDevice, (x) => x.courseType)
  requiredDevices: Relation<CourseTypeDevice>[];
}
