import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../database/base.entity.js';

/** Kunde: a company booking adult or on-site courses. Master data stays in Abacus/OdAOrg for the PoC. */
@Entity()
export class Customer extends BaseEntity {
  @Column('text')
  name: string;

  @Column({ type: 'text', nullable: true })
  addressLine: string | null;

  @Column({ type: 'text', nullable: true })
  postalCode: string | null;

  @Column({ type: 'text', nullable: true })
  city: string | null;

  @Column({ type: 'text', nullable: true })
  contactName: string | null;

  @Column({ type: 'text', nullable: true })
  contactEmail: string | null;

  @Column({ type: 'text', nullable: true })
  contactPhone: string | null;

  @Column({ type: 'text', nullable: true })
  externalRefAbacus: string | null;

  @Column({ type: 'text', nullable: true })
  externalRefOdaorg: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;
}
