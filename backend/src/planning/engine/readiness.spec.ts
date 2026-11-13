import { Track } from '../../database/enums.js';
import { buildSnapshot } from './fixture.js';
import { checkReadiness, isVariantModule, periodScope } from './readiness.js';
import type { ReadinessItem, ReadinessRule } from './types.js';

const FS_2027 = { startsOn: '2027-02-01', endsOn: '2027-07-31' };
const HS_2027 = { startsOn: '2027-08-01', endsOn: '2028-01-31' };

const item = (items: ReadinessItem[], rule: ReadinessRule) =>
  items.find((i) => i.rule === rule)!;

describe('isVariantModule', () => {
  it('recognises variants and electives', () => {
    for (const code of [
      'üK 5.1.D EFZ',
      'üK 6.2.L EFZ',
      'üK 5.HAB EFZ',
      'üK 5.Kran EFZ',
      'üK 6.R3 EFZ',
      'üK 6.R4 EFZ',
    ]) {
      expect(isVariantModule(code)).toBe(true);
    }
    for (const code of [
      'üK 1.1 EFZ',
      'üK 2.0 EBA',
      'PO1 EFZ [EFZ BiVo2024]',
      'Start-up EBA [EBA BiVo2024]',
    ]) {
      expect(isVariantModule(code)).toBe(false);
    }
  });
});

describe('periodScope', () => {
  it('lists the cohorts in training and the modules of their semester', () => {
    const scope = periodScope(buildSnapshot(), FS_2027);
    expect(scope.cohorts).toEqual([
      expect.objectContaining({ semester: 4, members: 38 }),
    ]);
    expect(scope.modules.map((m) => m.module.id)).toEqual(['M1', 'M2']);
    expect(
      periodScope(buildSnapshot(), HS_2027).modules.map((m) => m.module.id),
    ).toEqual(['MV']);
  });
});

describe('checkReadiness', () => {
  it('reports the data gaps of the fixture for the spring semester', () => {
    const { items } = checkReadiness(buildSnapshot(), FS_2027);
    expect(items.map((i) => i.rule)).toEqual([
      'time_windows',
      'prerequisites',
      'school_days',
      'variants',
      'semesters',
      'requirements',
      'devices',
      'availability',
      'uk_locations',
      'holidays',
    ]);
    expect(item(items, 'time_windows')).toMatchObject({
      status: 'warning',
      count: 1,
      details: ['UK-2 · 2025 EFZ'],
    });
    expect(item(items, 'prerequisites')).toMatchObject({
      status: 'ok',
      count: 1,
    });
    expect(item(items, 'school_days')).toMatchObject({
      status: 'warning',
      count: 2,
    });
    expect(item(items, 'variants')).toMatchObject({ status: 'ok', count: 0 });
    expect(item(items, 'semesters')).toMatchObject({ status: 'ok', count: 0 });
    expect(item(items, 'requirements')).toMatchObject({
      status: 'warning',
      count: 1,
      message:
        'Skills und Zertifikate: 1 von 2 Kurstypen ohne Anforderungen – Regel prüft nur Sprache und Verfügbarkeit',
    });
    expect(item(items, 'devices')).toMatchObject({ status: 'ok', count: 2 });
    expect(item(items, 'availability')).toMatchObject({
      status: 'ok',
      count: 2,
    });
    expect(item(items, 'uk_locations')).toMatchObject({
      status: 'ok',
      count: 0,
    });
    expect(item(items, 'holidays').status).toBe('ok');
  });

  it('marks rules without data as skipped', () => {
    const snapshot = buildSnapshot({ devices: new Map(), availabilities: [] });
    for (const m of snapshot.modules.values()) m.prerequisiteModuleIds = [];
    const { items } = checkReadiness(snapshot, FS_2027);
    expect(item(items, 'devices').status).toBe('skipped');
    expect(item(items, 'availability').status).toBe('skipped');
    expect(item(items, 'prerequisites').status).toBe('skipped');
  });

  it('warns about variants, semester anomalies and schools without ÜK location', () => {
    const snapshot = buildSnapshot();
    snapshot.modules.set('MX', {
      id: 'MX',
      track: Track.Eba,
      courseTypeId: 'UK-1',
      semester: 6,
      sequence: 601,
      active: true,
      prerequisiteModuleIds: [],
    });
    snapshot.schools.get('S2')!.nearestLocationId = 'BER';
    const { items } = checkReadiness(snapshot, HS_2027);
    expect(item(items, 'variants')).toMatchObject({
      status: 'warning',
      count: 1,
      details: ['üK 5.1.D EFZ'],
    });
    expect(item(items, 'semesters')).toMatchObject({
      status: 'warning',
      count: 1,
      details: ['UK-1 · Semester 6'],
    });
    expect(item(items, 'uk_locations')).toMatchObject({
      status: 'warning',
      count: 1,
      details: ['CPNV'],
    });
    // Only the variant module is in scope, so no plannable module lacks a window.
    expect(item(items, 'time_windows')).toMatchObject({
      status: 'ok',
      count: 0,
    });
  });
});
