import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../database/base.entity.js';
import {
  PLANNING_RUN_STAGE_ENUM,
  PLANNING_RUN_STATUS_ENUM,
  PlanningRunStage,
  PlanningRunStatus,
} from '../database/enums.js';
import { User } from '../users/user.entity.js';

/**
 * Planungslauf: one pass of demand → courses → staffing for a period, which
 * is committed or discarded as a whole.
 */
@Entity()
@Check('"period_starts_on" <= "period_ends_on"')
export class PlanningRun extends BaseEntity {
  @Column('text')
  label: string;

  @Column('date')
  periodStartsOn: string;

  @Column('date')
  periodEndsOn: string;

  @Column({
    type: 'enum',
    enum: PlanningRunStage,
    enumName: PLANNING_RUN_STAGE_ENUM,
    default: PlanningRunStage.Demand,
  })
  stage: PlanningRunStage;

  @Column({
    type: 'enum',
    enum: PlanningRunStatus,
    enumName: PLANNING_RUN_STATUS_ENUM,
    default: PlanningRunStatus.Draft,
  })
  status: PlanningRunStatus;

  @Column({ type: 'uuid', nullable: true })
  createdByUserId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser: Relation<User> | null;

  @Column({ type: 'timestamptz', nullable: true })
  committedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;
}
