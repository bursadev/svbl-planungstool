import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../database/base.entity.js';
import {
  EMPLOYMENT_TYPE_ENUM,
  EmploymentType,
  INSTRUCTOR_STATUS_ENUM,
  InstructorStatus,
  LANGUAGE_ENUM,
  Language,
} from '../database/enums.js';
import { Location } from '../locations/location.entity.js';
import { Availability } from './availability.entity.js';
import { InstructorCertificate } from './instructor-certificate.entity.js';
import { InstructorSkill } from './instructor-skill.entity.js';

/** Soft planning preferences of an instructor, stored as jsonb. */
export interface InstructorPreferences {
  preferredLocationIds?: string[];
  avoidInstructorIds?: string[];
  notes?: string;
}

/**
 * Ausbilder (Ausbildner, Instruktor): an employee or freelancer who teaches.
 * `taught` and `teach` from the prototype are derived from assignments.
 */
@Entity()
@Index(['lastName', 'firstName'])
export class Instructor extends BaseEntity {
  @Column('text')
  firstName: string;

  @Column('text')
  lastName: string;

  @Column({ type: 'text', nullable: true })
  email: string | null;

  @Column({ type: 'text', nullable: true })
  phone: string | null;

  @Column({
    type: 'enum',
    enum: EmploymentType,
    enumName: EMPLOYMENT_TYPE_ENUM,
  })
  employmentType: EmploymentType;

  @Column('uuid')
  homeLocationId: string;

  @ManyToOne(() => Location, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'home_location_id' })
  homeLocation: Relation<Location>;

  @Column({
    type: 'enum',
    enum: Language,
    enumName: LANGUAGE_ENUM,
    array: true,
  })
  languages: Language[];

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  weeklyHours: string | null;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  overtimeCapHours: string | null;

  @Column({ type: 'numeric', precision: 8, scale: 2, nullable: true })
  costRate: string | null;

  @Column({ type: 'smallint', nullable: true })
  maxTravelMinutes: number | null;

  @Column({ type: 'jsonb', nullable: true })
  preferences: InstructorPreferences | null;

  /** Reference in the external HR system (Abacus). */
  @Column({ type: 'text', nullable: true })
  externalRef: string | null;

  @Column({
    type: 'enum',
    enum: InstructorStatus,
    enumName: INSTRUCTOR_STATUS_ENUM,
    default: InstructorStatus.Active,
  })
  status: InstructorStatus;

  @OneToMany(() => InstructorSkill, (s) => s.instructor)
  skills: Relation<InstructorSkill>[];

  @OneToMany(() => InstructorCertificate, (c) => c.instructor)
  certificates: Relation<InstructorCertificate>[];

  @OneToMany(() => Availability, (a) => a.instructor)
  availabilities: Relation<Availability>[];
}
