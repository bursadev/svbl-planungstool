import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../database/base.entity.js';
import { TrainingCompany } from './training-company.entity.js';

/** Lehrmeister, Berufsbildner: the person at a training company responsible for its apprentices. */
@Entity()
@Index(['email'])
export class Trainer extends BaseEntity {
  @Column('uuid')
  trainingCompanyId: string;

  @ManyToOne(() => TrainingCompany, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'training_company_id' })
  trainingCompany: Relation<TrainingCompany>;

  @Column('text')
  firstName: string;

  @Column('text')
  lastName: string;

  @Column({ type: 'text', nullable: true })
  email: string | null;

  @Column({ type: 'text', nullable: true })
  phone: string | null;
}
