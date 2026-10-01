import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { CourseType } from '../courses/course-type.entity.js';
import { Timestamps } from '../database/base.entity.js';
import { CertificateType } from './certificate-type.entity.js';

/**
 * Link table: the course types that count towards a certificate type's
 * maintenance rule (`maintenanceMinPerYear`).
 */
@Entity()
export class CertificateTypeMaintenanceCourseType extends Timestamps {
  @PrimaryColumn('uuid')
  certificateTypeId: string;

  @ManyToOne(() => CertificateType, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'certificate_type_id' })
  certificateType: Relation<CertificateType>;

  @PrimaryColumn('uuid')
  courseTypeId: string;

  @ManyToOne(() => CourseType, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_type_id' })
  courseType: Relation<CourseType>;
}
