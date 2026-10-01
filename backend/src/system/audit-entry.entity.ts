import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../database/base.entity.js';
import { User } from '../users/user.entity.js';

/** Änderungsprotokoll: who changed what, with the record before and after. */
@Entity()
@Index(['entityType', 'entityId', 'occurredAt'])
export class AuditEntry extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  actorUserId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_user_id' })
  actorUser: Relation<User> | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  occurredAt: Date;

  @Column('text')
  entityType: string;

  @Column('uuid')
  entityId: string;

  @Column('text')
  action: string;

  @Column({ type: 'jsonb', nullable: true })
  before: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  after: Record<string, unknown> | null;

  @Column('text')
  summary: string;
}
