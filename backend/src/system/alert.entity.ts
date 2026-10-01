import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../database/base.entity.js';
import {
  ALERT_KIND_ENUM,
  ALERT_SEVERITY_ENUM,
  ALERT_STATUS_ENUM,
  AlertKind,
  AlertSeverity,
  AlertStatus,
} from '../database/enums.js';
import { User } from '../users/user.entity.js';

/** Hinweis: something a planner has to look at; open → acknowledged → resolved. */
@Entity()
@Index(['status', 'severity'])
@Index(['subjectType', 'subjectId'])
export class Alert extends BaseEntity {
  @Column({ type: 'enum', enum: AlertKind, enumName: ALERT_KIND_ENUM })
  kind: AlertKind;

  @Column({ type: 'enum', enum: AlertSeverity, enumName: ALERT_SEVERITY_ENUM })
  severity: AlertSeverity;

  @Column('text')
  subjectType: string;

  @Column('uuid')
  subjectId: string;

  @Column('text')
  message: string;

  @Column({ type: 'date', nullable: true })
  dueOn: string | null;

  @Column({
    type: 'enum',
    enum: AlertStatus,
    enumName: ALERT_STATUS_ENUM,
    default: AlertStatus.Open,
  })
  status: AlertStatus;

  @Column({ type: 'uuid', nullable: true })
  acknowledgedByUserId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'acknowledged_by_user_id' })
  acknowledgedByUser: Relation<User> | null;

  @Column({ type: 'timestamptz', nullable: true })
  acknowledgedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;

  /** Stable key per detected condition so a re-run of the check does not raise the alert twice. */
  @Column({ type: 'text', nullable: true, unique: true })
  dedupeKey: string | null;
}
