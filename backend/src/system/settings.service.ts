import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthUser } from '../auth/clerk-auth.guard.js';
import { AuditService } from './audit.service.js';
import { Setting } from './setting.entity.js';

export interface SettingView {
  key: string;
  value: unknown;
  updatedAt: Date;
  updatedBy: string | null;
}

const KEY_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;

/** Application-wide configuration values, addressed by key. */
@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly settings: Repository<Setting>,
    private readonly audit: AuditService,
  ) {}

  async list(): Promise<SettingView[]> {
    const settings = await this.settings.find({
      relations: { updatedByUser: true },
      order: { key: 'ASC' },
    });
    return settings.map(toView);
  }

  async upsert(
    key: string,
    value: unknown,
    actor: AuthUser,
  ): Promise<SettingView> {
    if (!KEY_PATTERN.test(key)) {
      throw new BadRequestException('Ungültiger Schlüssel.');
    }
    const existing = await this.settings.findOneBy({ key });
    // One statement (INSERT … ON CONFLICT), so two concurrent first PUTs of
    // the same key can't race each other into a unique violation. The cast is
    // type-level only: the jsonb column is `unknown`, which TypeORM's
    // partial-entity type cannot express.
    await this.settings.upsert(
      { key, value: value as object, updatedByUserId: actor.dbUserId },
      { conflictPaths: ['key'] },
    );
    const setting = await this.settings.findOneByOrFail({ key });
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'setting',
      entityId: setting.id,
      action: existing ? 'update' : 'create',
      before: existing ? { key, value: existing.value } : undefined,
      after: { key, value },
      summary: `hat Einstellung «${key}» gesetzt`,
    });
    return this.get(key);
  }

  async remove(key: string, actor: AuthUser): Promise<void> {
    const setting = await this.settings.findOneBy({ key });
    if (!setting) return;
    await this.settings.delete(setting.id);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'setting',
      entityId: setting.id,
      action: 'delete',
      before: { key, value: setting.value },
      summary: `hat Einstellung «${key}» gelöscht`,
    });
  }

  private async get(key: string): Promise<SettingView> {
    const setting = await this.settings.findOneOrFail({
      where: { key },
      relations: { updatedByUser: true },
    });
    return toView(setting);
  }
}

function toView(setting: Setting): SettingView {
  return {
    key: setting.key,
    value: setting.value,
    updatedAt: setting.updatedAt,
    updatedBy: setting.updatedByUser?.displayName ?? null,
  };
}
