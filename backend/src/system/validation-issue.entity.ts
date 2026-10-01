import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../database/base.entity.js';
import {
  VALIDATION_ISSUE_STATUS_ENUM,
  ValidationIssueStatus,
} from '../database/enums.js';
import { User } from '../users/user.entity.js';
import { ImportBatch } from './import-batch.entity.js';

/**
 * Validierungsproblem: a suspected data problem raised by the scoring
 * function, e.g. a duplicate apprentice; open → merged or dismissed.
 */
@Entity()
@Index(['status'])
@Index(['subjectType', 'subjectId'])
export class ValidationIssue extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  importBatchId: string | null;

  @ManyToOne(() => ImportBatch, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'import_batch_id' })
  importBatch: Relation<ImportBatch> | null;

  @Column('text')
  rule: string;

  @Column({ type: 'numeric', precision: 4, scale: 3, nullable: true })
  score: string | null;

  @Column('text')
  message: string;

  @Column('text')
  subjectType: string;

  @Column('uuid')
  subjectId: string;

  /** The other record of a suspected duplicate pair, when the rule compares two. */
  @Column({ type: 'uuid', nullable: true })
  relatedSubjectId: string | null;

  @Column({
    type: 'enum',
    enum: ValidationIssueStatus,
    enumName: VALIDATION_ISSUE_STATUS_ENUM,
    default: ValidationIssueStatus.Open,
  })
  status: ValidationIssueStatus;

  @Column({ type: 'uuid', nullable: true })
  resolvedByUserId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'resolved_by_user_id' })
  resolvedByUser: Relation<User> | null;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;
}
