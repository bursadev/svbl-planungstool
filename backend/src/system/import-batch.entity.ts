import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { VocationalSchool } from '../apprentices/vocational-school.entity.js';
import { BaseEntity } from '../database/base.entity.js';
import {
  IMPORT_BATCH_STATUS_ENUM,
  IMPORT_SOURCE_ENUM,
  ImportBatchStatus,
  ImportSource,
} from '../database/enums.js';
import { User } from '../users/user.entity.js';

export interface ImportLogEntry {
  row: number;
  level: 'info' | 'warning' | 'error';
  message: string;
}

/**
 * Importlauf: one run of an import (planning Excel, school export, manual);
 * imported rows reference it for provenance.
 */
@Entity()
export class ImportBatch extends BaseEntity {
  @Column({ type: 'enum', enum: ImportSource, enumName: IMPORT_SOURCE_ENUM })
  source: ImportSource;

  @Column({ type: 'uuid', nullable: true })
  vocationalSchoolId: string | null;

  @ManyToOne(() => VocationalSchool, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vocational_school_id' })
  vocationalSchool: Relation<VocationalSchool> | null;

  @Column({ type: 'text', nullable: true })
  fileName: string | null;

  @Column({ type: 'text', nullable: true })
  mappingVersion: string | null;

  @Column({
    type: 'enum',
    enum: ImportBatchStatus,
    enumName: IMPORT_BATCH_STATUS_ENUM,
    default: ImportBatchStatus.Uploaded,
  })
  status: ImportBatchStatus;

  @Column({ type: 'uuid', nullable: true })
  importedByUserId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'imported_by_user_id' })
  importedByUser: Relation<User> | null;

  @Column({ type: 'timestamptz', nullable: true })
  appliedAt: Date | null;

  @Column({ type: 'integer', default: 0 })
  rowsRead: number;

  @Column({ type: 'integer', default: 0 })
  rowsCreated: number;

  @Column({ type: 'integer', default: 0 })
  rowsUpdated: number;

  @Column({ type: 'integer', default: 0 })
  rowsRejected: number;

  @Column({ type: 'jsonb', nullable: true })
  log: ImportLogEntry[] | null;
}
