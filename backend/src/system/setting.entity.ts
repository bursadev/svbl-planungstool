import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { BaseEntity } from '../database/base.entity.js';
import { User } from '../users/user.entity.js';

/** Einstellung: one application-wide configuration value, addressed by key. */
@Entity()
export class Setting extends BaseEntity {
  @Column({ type: 'text', unique: true })
  key: string;

  @Column({ type: 'jsonb' })
  value: unknown;

  @Column({ type: 'uuid', nullable: true })
  updatedByUserId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updated_by_user_id' })
  updatedByUser: Relation<User> | null;
}
