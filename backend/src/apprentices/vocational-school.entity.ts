import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { BaseEntity } from '../database/base.entity.js';
import { LANGUAGE_ENUM, Language } from '../database/enums.js';
import { Location } from '../locations/location.entity.js';

/** How the school's apprentice export maps onto apprentice fields. */
export interface SchoolImportMapping {
  version: string;
  sheet?: string;
  headerRow: number;
  /** Source column header → apprentice field name. */
  columns: Record<string, string>;
  classDaySheet?: string;
}

/** Berufsschule: the school an apprentice attends; source of the apprentice list. */
@Entity()
export class VocationalSchool extends BaseEntity {
  @Column('text')
  name: string;

  @Column({ type: 'text', unique: true })
  shortName: string;

  @Column({ type: 'text', nullable: true })
  addressLine: string | null;

  @Column({ type: 'text', nullable: true })
  postalCode: string | null;

  @Column({ type: 'text', nullable: true })
  city: string | null;

  @Column({ type: 'text', nullable: true })
  canton: string | null;

  @Column({ type: 'enum', enum: Language, enumName: LANGUAGE_ENUM })
  language: Language;

  /** Default ÜK location of the school's apprentices (about 20 schools map onto 5 centres). */
  @Column('uuid')
  nearestLocationId: string;

  @ManyToOne(() => Location, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'nearest_location_id' })
  nearestLocation: Relation<Location>;

  @Column({ type: 'text', nullable: true })
  contactName: string | null;

  @Column({ type: 'text', nullable: true })
  contactEmail: string | null;

  @Column({ type: 'text', nullable: true })
  contactPhone: string | null;

  @Column({ type: 'jsonb', nullable: true })
  importMapping: SchoolImportMapping | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;
}
