import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditEntry } from './audit-entry.entity.js';

export interface AuditRecord {
  /** Internal user id (user.id), null for system jobs. */
  actorUserId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  /** The German sentence the UI lists: «hat Raum «Halle A» in Rupperswil angelegt». */
  summary: string;
}

/** Writes one audit_entry per change; every write service calls it. */
@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditEntry)
    private readonly entries: Repository<AuditEntry>,
  ) {}

  async record(record: AuditRecord): Promise<void> {
    const entry = this.entries.create({
      actorUserId: record.actorUserId,
      entityType: record.entityType,
      entityId: record.entityId,
      action: record.action,
      summary: record.summary,
    });
    entry.before = record.before ?? null;
    entry.after = record.after ?? null;
    await this.entries.save(entry);
  }
}

/** Plain-column snapshot of an entity for before/after (drops relations and functions). */
export function snapshot(entity: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(entity).filter(
      ([, v]) =>
        v === null ||
        ['string', 'number', 'boolean'].includes(typeof v) ||
        v instanceof Date ||
        Array.isArray(v),
    ),
  );
}
