import { IsNull, Not, type EntityManager } from 'typeorm';
import { DEVICE_CATEGORY_LABELS } from '../common/labels.js';
import type { TabularSpec } from '../common/tabular-spec.js';
import {
  bool,
  enumOf,
  normalizeKey,
  refList,
  text,
} from '../common/tabular.js';
import { CertificateType } from '../instructors/certificate-type.entity.js';
import { Skill } from '../instructors/skill.entity.js';
import { DeviceTypeQualification } from './device-type-qualification.entity.js';
import { DeviceType } from './device-type.entity.js';
import {
  withQualifications,
  type DeviceTypeView,
} from './device-types.service.js';
import {
  ImportDeviceTypeDto,
  ImportDeviceTypeUpdateDto,
} from './dto/device-type.dto.js';

/** Ids of a list for the «unchanged» check; an empty list counts as an empty cell. */
const idsOrNull = (ids: string[]): string[] | null => (ids.length ? ids : null);

/**
 * CSV columns, import and bulk actions of `/device-types`; the key is the
 * code. The qualifications are lists in one cell each (certificate types by
 * code, skills by name) and replace the current ones like
 * `PUT /device-types/:id/qualifications`; an empty cell clears them.
 */
export const DEVICE_TYPES_TABULAR: TabularSpec<DeviceType> = {
  entity: DeviceType,
  entityType: 'device_type',
  noun: 'Gerätetyp',
  fileName: 'geraetetypen',
  label: (t) => t.name ?? t.code,
  columns: [
    text('Code', 'code', { required: true, examples: ['STAPLER-S', 'HAB'] }),
    text('Name', 'name', {
      required: true,
      examples: ['Stapler Kat. S', 'Hubarbeitsbühne'],
    }),
    enumOf('Kategorie', 'category', DEVICE_CATEGORY_LABELS, {
      required: true,
      examples: ['Stapler', 'Hebebühne'],
    }),
    bool('Aktiv', 'active', { examples: ['ja', 'ja'] }),
    refList('Zertifikatstypen', 'certificateTypeIds', 'certificateTypes', {
      nullable: true,
      get: (t: DeviceTypeView) =>
        t.qualifications.certificateTypes.map((c) => c.code),
      examples: ['SUVA-S', 'IPAF'],
    }),
    refList('Skills', 'skillIds', 'skills', {
      nullable: true,
      get: (t: DeviceTypeView) => t.qualifications.skills.map((s) => s.name),
      examples: ['Staplerfahrer', ''],
    }),
  ],
  archive: {
    archived: { active: false },
    restored: { active: true },
    isArchived: (t) => !t.active,
  },
  import: {
    createDto: ImportDeviceTypeDto,
    updateDto: ImportDeviceTypeUpdateDto,
    keyHeaders: ['Code'],
    key: (values) =>
      typeof values.code === 'string' && values.code
        ? normalizeKey(values.code)
        : null,
    entityKey: (t) => normalizeKey(t.code),
    lookups: {
      certificateTypes: async (manager) =>
        new Map(
          (await manager.find(CertificateType)).map((c) => [
            normalizeKey(c.code),
            c.id,
          ]),
        ),
      skills: async (manager) =>
        new Map(
          (await manager.find(Skill)).map((s) => [normalizeKey(s.name), s.id]),
        ),
    },
    loadExisting: async (manager) => {
      const links = await manager.find(DeviceTypeQualification, {
        relations: { certificateType: true, skill: true },
      });
      const types = await manager.find(DeviceType);
      return types.map((t) => withQualifications(t, links));
    },
    currentValues: (entity) => {
      const t = entity as DeviceTypeView;
      return {
        code: t.code,
        name: t.name,
        category: t.category,
        active: t.active,
        certificateTypeIds: idsOrNull(
          t.qualifications.certificateTypes.map((c) => c.id),
        ),
        skillIds: idsOrNull(t.qualifications.skills.map((s) => s.id)),
      };
    },
    virtualFields: ['certificateTypeIds', 'skillIds'],
    afterSave: async (manager, rows) => {
      for (const { entity, values } of rows) {
        if ('certificateTypeIds' in values) {
          await replaceLinks(
            manager,
            entity.id,
            'certificateTypeId',
            (values.certificateTypeIds as string[] | null) ?? [],
          );
        }
        if ('skillIds' in values) {
          await replaceLinks(
            manager,
            entity.id,
            'skillId',
            (values.skillIds as string[] | null) ?? [],
          );
        }
      }
    },
  },
};

/** Replaces one kind of qualification (certificate types or skills) of a device type. */
async function replaceLinks(
  manager: EntityManager,
  deviceTypeId: string,
  field: 'certificateTypeId' | 'skillId',
  ids: string[],
): Promise<void> {
  await manager.delete(DeviceTypeQualification, {
    deviceTypeId,
    [field]: Not(IsNull()),
  });
  if (!ids.length) return;
  await manager.insert(
    DeviceTypeQualification,
    ids.map((id) => ({
      deviceTypeId,
      certificateTypeId: field === 'certificateTypeId' ? id : null,
      skillId: field === 'skillId' ? id : null,
    })),
  );
}
