import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { BaseEntity } from '../database/base.entity.js';
import { LANGUAGE_ENUM, Language } from '../database/enums.js';
import { Customer } from './customer.entity.js';

/** Teilnehmer: an adult course participant, optionally sent by a customer. Minimal for the PoC. */
@Entity()
export class Participant extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  customerId: string | null;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_id' })
  customer: Relation<Customer> | null;

  @Column('text')
  firstName: string;

  @Column('text')
  lastName: string;

  @Column({ type: 'text', nullable: true })
  email: string | null;

  @Column({ type: 'text', nullable: true })
  phone: string | null;

  @Column({ type: 'enum', enum: Language, enumName: LANGUAGE_ENUM })
  language: Language;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
