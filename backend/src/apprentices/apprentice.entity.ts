import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  type Relation,
} from 'typeorm';
import { Cohort } from '../curriculum/cohort.entity.js';
import { BaseEntity } from '../database/base.entity.js';
import {
  APPRENTICE_STATUS_ENUM,
  ApprenticeStatus,
  GENDER_ENUM,
  Gender,
  LANGUAGE_ENUM,
  Language,
  TRACK_ENUM,
  Track,
} from '../database/enums.js';
import { ImportBatch } from '../system/import-batch.entity.js';
import { Enrollment } from './enrollment.entity.js';
import { SchoolClass } from './school-class.entity.js';
import { Trainer } from './trainer.entity.js';
import { TrainingCompany } from './training-company.entity.js';
import { VocationalSchool } from './vocational-school.entity.js';

/** Lernende: a person in EFZ or EBA training who attends ÜK; the school export is the source of truth. */
@Entity()
@Index(['lastName', 'firstName', 'birthDate'])
@Index(['cohortId'])
@Index(['schoolClassId'])
@Index(['vocationalSchoolId'])
export class Apprentice extends BaseEntity {
  @Column({ type: 'text', nullable: true, unique: true })
  ahvNumber: string | null;

  /** Identifier from the school export. */
  @Column({ type: 'text', nullable: true })
  externalId: string | null;

  @Column('text')
  firstName: string;

  @Column('text')
  lastName: string;

  @Column('date')
  birthDate: string;

  @Column({
    type: 'enum',
    enum: Gender,
    enumName: GENDER_ENUM,
    nullable: true,
  })
  gender: Gender | null;

  @Column({ type: 'text', nullable: true })
  email: string | null;

  @Column({ type: 'text', nullable: true })
  phone: string | null;

  @Column({ type: 'text', nullable: true })
  addressLine: string | null;

  @Column({ type: 'text', nullable: true })
  postalCode: string | null;

  @Column({ type: 'text', nullable: true })
  city: string | null;

  @Column({ type: 'text', nullable: true })
  nativeLanguage: string | null;

  @Column({ type: 'enum', enum: Language, enumName: LANGUAGE_ENUM })
  language: Language;

  @Column({ type: 'enum', enum: Track, enumName: TRACK_ENUM })
  track: Track;

  @Column({ type: 'text', nullable: true })
  professionCode: string | null;

  @Column('uuid')
  cohortId: string;

  @ManyToOne(() => Cohort, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cohort_id' })
  cohort: Relation<Cohort>;

  @Column('uuid')
  vocationalSchoolId: string;

  @ManyToOne(() => VocationalSchool, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vocational_school_id' })
  vocationalSchool: Relation<VocationalSchool>;

  @Column({ type: 'uuid', nullable: true })
  schoolClassId: string | null;

  @ManyToOne(() => SchoolClass, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'school_class_id' })
  schoolClass: Relation<SchoolClass> | null;

  @Column({ type: 'uuid', nullable: true })
  trainingCompanyId: string | null;

  @ManyToOne(() => TrainingCompany, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'training_company_id' })
  trainingCompany: Relation<TrainingCompany> | null;

  @Column({ type: 'uuid', nullable: true })
  trainerId: string | null;

  @ManyToOne(() => Trainer, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'trainer_id' })
  trainer: Relation<Trainer> | null;

  @Column({ type: 'date', nullable: true })
  apprenticeshipStart: string | null;

  @Column({ type: 'date', nullable: true })
  apprenticeshipEnd: string | null;

  /** Attends the Berufsmaturität (BM1) alongside the apprenticeship, which adds school days. */
  @Column({ type: 'boolean', default: false })
  hasBm1: boolean;

  @Column({
    type: 'enum',
    enum: ApprenticeStatus,
    enumName: APPRENTICE_STATUS_ENUM,
    default: ApprenticeStatus.Active,
  })
  status: ApprenticeStatus;

  /** Provenance: the import that created or last updated this row. */
  @Column({ type: 'uuid', nullable: true })
  importBatchId: string | null;

  @ManyToOne(() => ImportBatch, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'import_batch_id' })
  importBatch: Relation<ImportBatch> | null;

  @Column({ type: 'timestamptz', nullable: true })
  importedAt: Date | null;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.apprentice)
  enrollments: Relation<Enrollment>[];
}
