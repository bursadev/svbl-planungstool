import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../database/base.entity.js';
import { CertificateType } from './certificate-type.entity.js';
import { Instructor } from './instructor.entity.js';

/**
 * Zertifikat: a certificate an instructor holds. The status valid / expiring /
 * expired is not stored; it is derived per course day from `validUntil`.
 */
@Entity()
@Index(['instructorId', 'certificateTypeId'])
export class InstructorCertificate extends BaseEntity {
  @Column('uuid')
  instructorId: string;

  @ManyToOne(() => Instructor, (instructor) => instructor.certificates, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'instructor_id' })
  instructor: Relation<Instructor>;

  @Column('uuid')
  certificateTypeId: string;

  @ManyToOne(() => CertificateType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'certificate_type_id' })
  certificateType: Relation<CertificateType>;

  @Column('date')
  issuedOn: string;

  /** Null when the certificate type does not expire. */
  @Column({ type: 'date', nullable: true })
  validUntil: string | null;

  @Column({ type: 'text', nullable: true })
  documentUrl: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
