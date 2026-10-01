import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../database/base.entity.js';

/** Lehrbetrieb: the employer of an apprentice. */
@Entity()
@Index(['name', 'postalCode'])
export class TrainingCompany extends BaseEntity {
  @Column('text')
  name: string;

  @Column({ type: 'text', nullable: true })
  addressLine: string | null;

  @Column({ type: 'text', nullable: true })
  postalCode: string | null;

  @Column({ type: 'text', nullable: true })
  city: string | null;

  @Column({ type: 'text', nullable: true })
  email: string | null;

  @Column({ type: 'text', nullable: true })
  phone: string | null;

  @Column({ type: 'text', nullable: true })
  externalRef: string | null;
}
