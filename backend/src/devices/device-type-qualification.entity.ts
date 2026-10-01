import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Unique,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../database/base.entity.js';
import { CertificateType } from '../instructors/certificate-type.entity.js';
import { Skill } from '../instructors/skill.entity.js';
import { DeviceType } from './device-type.entity.js';

/**
 * Gerätequalifikation: which certificate type or skill qualifies an
 * instructor for a device type. Exactly one of the two is set.
 */
@Entity()
@Unique(['deviceTypeId', 'certificateTypeId'])
@Unique(['deviceTypeId', 'skillId'])
@Check('num_nonnulls("certificate_type_id", "skill_id") = 1')
export class DeviceTypeQualification extends BaseEntity {
  @Column('uuid')
  deviceTypeId: string;

  @ManyToOne(() => DeviceType, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_type_id' })
  deviceType: Relation<DeviceType>;

  @Column({ type: 'uuid', nullable: true })
  certificateTypeId: string | null;

  @ManyToOne(() => CertificateType, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'certificate_type_id' })
  certificateType: Relation<CertificateType> | null;

  @Column({ type: 'uuid', nullable: true })
  skillId: string | null;

  @ManyToOne(() => Skill, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'skill_id' })
  skill: Relation<Skill> | null;
}
