import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { BaseEntity } from '../database/base.entity.js';
import { User } from '../users/user.entity.js';

export interface AssistantMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: Record<string, unknown>[];
}

/**
 * Assistenten-Gespräch: traceability for the AI assistant, keeping the
 * messages and the records it cited as sources.
 */
@Entity()
export class AssistantConversation extends BaseEntity {
  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  startedAt: Date;

  @Column({ type: 'jsonb' })
  messages: AssistantMessage[];

  @Column({ type: 'jsonb', nullable: true })
  cited: { entityType: string; entityId: string }[] | null;
}
