import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { Timestamps } from '../database/base.entity.js';
import { CertificateType } from '../instructors/certificate-type.entity.js';
import { CourseType } from './course-type.entity.js';

/** Certificate (Zertifikat) an instructor needs to teach a course type (Kurstyp). */
@Entity()
export class CourseTypeCertificate extends Timestamps {
  @PrimaryColumn('uuid')
  courseTypeId: string;

  @ManyToOne(
    () => CourseType,
    (courseType) => courseType.requiredCertificates,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'course_type_id' })
  courseType: Relation<CourseType>;

  @PrimaryColumn('uuid')
  certificateTypeId: string;

  @ManyToOne(() => CertificateType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'certificate_type_id' })
  certificateType: Relation<CertificateType>;
}
