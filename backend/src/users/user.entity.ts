import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { Trainer } from '../apprentices/trainer.entity.js';
import { BaseEntity } from '../database/base.entity.js';
import {
  LANGUAGE_ENUM,
  Language,
  USER_ROLE_ENUM,
  USER_STATUS_ENUM,
  UserRole,
  UserStatus,
} from '../database/enums.js';
import { Instructor } from '../instructors/instructor.entity.js';

/**
 * Benutzer: mirror of the Clerk account (ADR-0003), created by webhook or on
 * first login; carries the links to instructor and trainer.
 */
@Entity()
export class User extends BaseEntity {
  @Column({ type: 'text', unique: true })
  clerkUserId: string;

  @Column({ type: 'text', unique: true })
  email: string;

  @Column('text')
  displayName: string;

  /** Mirrored from Clerk, where roles are defined and assigned. */
  @Column({ type: 'enum', enum: UserRole, enumName: USER_ROLE_ENUM })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: Language,
    enumName: LANGUAGE_ENUM,
    default: Language.De,
  })
  locale: Language;

  /** Deactivating keeps history. */
  @Column({
    type: 'enum',
    enum: UserStatus,
    enumName: USER_STATUS_ENUM,
    default: UserStatus.Active,
  })
  status: UserStatus;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @Column({ type: 'uuid', nullable: true, unique: true })
  instructorId: string | null;

  @ManyToOne(() => Instructor, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'instructor_id' })
  instructor: Relation<Instructor> | null;

  @Column({ type: 'uuid', nullable: true, unique: true })
  trainerId: string | null;

  @ManyToOne(() => Trainer, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'trainer_id' })
  trainer: Relation<Trainer> | null;
}
