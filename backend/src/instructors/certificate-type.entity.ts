import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../database/base.entity.js';

/**
 * Zertifikatstyp: a time-limited qualification (SUVA, IPAF, internal) that an
 * instructor can hold and a course type or device type can require.
 */
@Entity()
export class CertificateType extends BaseEntity {
  @Column({ type: 'text', unique: true })
  code: string;

  @Column('text')
  name: string;

  @Column({ type: 'text', nullable: true })
  issuer: string | null;

  /** Validity in years; null means the certificate does not expire. */
  @Column({ type: 'smallint', nullable: true })
  validityYears: number | null;

  /** How many days before expiry the dashboard starts warning. */
  @Column({ type: 'smallint', default: 60 })
  warningLeadDays: number;

  /**
   * Maintenance rule: minimum number of qualifying courses taught per year
   * (see CertificateTypeMaintenanceCourseType); null means no rule.
   */
  @Column({ type: 'smallint', nullable: true })
  maintenanceMinPerYear: number | null;
}
