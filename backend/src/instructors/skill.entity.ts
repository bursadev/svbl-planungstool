import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../database/base.entity.js';

/**
 * Skill (Qualifikation, Profession): an ability or profession an instructor
 * holds and a course type can require.
 */
@Entity()
export class Skill extends BaseEntity {
  @Column({ type: 'text', unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  category: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;
}
