import { BadRequestException } from '@nestjs/common';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsUUID,
} from 'class-validator';
import { In, type DataSource, type ObjectLiteral } from 'typeorm';
import { AuditEntry } from '../system/audit-entry.entity.js';
import { snapshot } from '../system/audit.service.js';
import { mapDatabaseError } from './database-errors.js';
import type { TabularSpec } from './tabular-spec.js';

export const BULK_ACTIONS = ['archive', 'restore', 'delete'] as const;
export type BulkAction = (typeof BULK_ACTIONS)[number];

/** Body of `POST /<resource>/bulk`. */
export class BulkActionDto {
  @IsIn(BULK_ACTIONS)
  action: BulkAction;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(2000)
  @IsUUID('all', { each: true })
  ids: string[];
}

export interface BulkResult {
  succeeded: string[];
  failed: { id: string; label: string; message: string }[];
}

/** German plural of the tables that can block a delete, for «Wird noch von Kursen verwendet.» */
const REFERENCING_TABLES: Record<string, string> = {
  apprentice: 'Lernenden',
  assignment: 'Einsätzen',
  availability: 'Verfügbarkeiten',
  certificate_type_maintenance_course_type: 'Zertifikatstypen',
  cohort: 'Jahrgängen',
  course: 'Kursen',
  course_day: 'Kurstagen',
  course_type: 'Kurstypen',
  course_type_certificate: 'Kurstypen',
  course_type_device: 'Kurstypen',
  course_type_skill: 'Kurstypen',
  curriculum_module: 'Bildungsplan-Modulen',
  customer: 'Kunden',
  demand: 'Bedarfen',
  device: 'Geräten',
  device_move: 'Geräte-Umzügen',
  device_reservation: 'Gerätereservationen',
  device_type_qualification: 'Gerätetypen',
  enrollment: 'Anmeldungen',
  instructor: 'Ausbildern',
  instructor_certificate: 'Ausbilder-Zertifikaten',
  instructor_skill: 'Ausbildern',
  location: 'Standorten',
  location_distance: 'Reisezeiten',
  participant: 'Teilnehmenden',
  room: 'Räumen',
  school_class: 'Schulklassen',
  time_window: 'Zeitfenstern',
  trainer: 'Berufsbildnern',
  training_company: 'Lehrbetrieben',
  user: 'Benutzern',
  vocational_school: 'Berufsschulen',
};

/** The reason a delete failed, naming the referencing table when Postgres tells which one. */
export function deleteFailureMessage(err: unknown): string | null {
  const http = mapDatabaseError(err);
  if (!http) return null;
  const detail =
    (err as { driverError?: { detail?: string } }).driverError?.detail ?? '';
  const table = /from table "([^"]+)"/.exec(detail)?.[1];
  const noun = table ? REFERENCING_TABLES[table] : undefined;
  return noun ? `Wird noch von ${noun} verwendet.` : http.message;
}

/**
 * Archives, restores or deletes many records of one resource. Archive and
 * restore are one UPDATE. Delete tries all ids at once and, when a foreign
 * key blocks it, retries id by id in savepoints, so the referenced records
 * land in `failed` with the reason and the rest is deleted. One audit entry
 * per changed record.
 */
export async function runBulk<TEntity extends ObjectLiteral & { id: string }>(
  ds: DataSource,
  spec: TabularSpec<TEntity>,
  dto: BulkActionDto,
  actorUserId: string | null,
): Promise<BulkResult> {
  const ids = [...new Set(dto.ids)];
  const result: BulkResult = { succeeded: [], failed: [] };
  const entities = await ds.manager.findBy(spec.entity, {
    id: In(ids),
  } as never);
  const byId = new Map(entities.map((e) => [e.id, e]));
  for (const id of ids) {
    if (!byId.has(id))
      result.failed.push({ id, label: id, message: 'Nicht gefunden.' });
  }

  if (dto.action === 'delete') {
    await bulkDelete(ds, spec, ids, entities, result, actorUserId);
    return result;
  }

  const archive = spec.archive;
  if (!archive) {
    throw new BadRequestException(
      'Diese Einträge können nicht archiviert werden.',
    );
  }
  const toArchive = dto.action === 'archive';
  const targets = entities.filter((e) => archive.isArchived(e) !== toArchive);
  const patch = toArchive ? archive.archived : archive.restored;
  await ds.transaction(async (manager) => {
    if (targets.length) {
      await manager.update(
        spec.entity,
        { id: In(targets.map((e) => e.id)) } as never,
        patch as never,
      );
    }
    const audits = targets.map((entity) => {
      const before = snapshot(entity);
      const after = { ...before, ...(patch as object) };
      return {
        actorUserId,
        entityType: spec.entityType,
        entityId: entity.id,
        action: dto.action,
        before,
        after,
        summary: `hat ${spec.noun} «${spec.label(entity)}» ${toArchive ? 'archiviert' : 'wiederhergestellt'}`,
      };
    });
    if (audits.length) await manager.insert(AuditEntry, audits as never);
  });
  // In the order of the request, not the order the database returned the rows.
  result.succeeded.push(...ids.filter((id) => byId.has(id)));
  return result;
}

async function bulkDelete<TEntity extends ObjectLiteral & { id: string }>(
  ds: DataSource,
  spec: TabularSpec<TEntity>,
  ids: string[],
  entities: TEntity[],
  result: BulkResult,
  actorUserId: string | null,
): Promise<void> {
  if (!entities.length) return;
  const runner = ds.createQueryRunner();
  await runner.connect();
  await runner.startTransaction();
  const deleted: TEntity[] = [];
  try {
    await runner.query('SAVEPOINT bulk_all');
    try {
      await runner.manager.delete(spec.entity, {
        id: In(entities.map((e) => e.id)),
      } as never);
      deleted.push(...entities);
    } catch (err) {
      if (!deleteFailureMessage(err)) throw err;
      await runner.query('ROLLBACK TO SAVEPOINT bulk_all');
      for (const entity of entities) {
        await runner.query('SAVEPOINT bulk_one');
        try {
          await runner.manager.delete(spec.entity, entity.id);
          await runner.query('RELEASE SAVEPOINT bulk_one');
          deleted.push(entity);
        } catch (one) {
          const message = deleteFailureMessage(one);
          if (!message) throw one;
          await runner.query('ROLLBACK TO SAVEPOINT bulk_one');
          result.failed.push({
            id: entity.id,
            label: spec.label(entity),
            message,
          });
        }
      }
    }
    if (deleted.length) {
      await runner.manager.insert(
        AuditEntry,
        deleted.map((entity) => ({
          actorUserId,
          entityType: spec.entityType,
          entityId: entity.id,
          action: 'delete',
          before: snapshot(entity),
          after: null,
          summary: `hat ${spec.noun} «${spec.label(entity)}» gelöscht`,
        })) as never,
      );
    }
    await runner.commitTransaction();
  } catch (err) {
    await runner.rollbackTransaction();
    throw err;
  } finally {
    await runner.release();
  }
  const gone = new Set(deleted.map((e) => e.id));
  result.succeeded.push(...ids.filter((id) => gone.has(id)));
}
