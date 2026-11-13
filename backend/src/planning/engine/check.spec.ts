import {
  AssignmentRole,
  AssignmentStatus,
  CourseStatus,
  Language,
} from '../../database/enums.js';
import {
  checkInstructor,
  rankCandidates,
  staticallyEligible,
  type CourseToStaff,
  type EngineContext,
} from './check.js';
import { buildSnapshot } from './fixture.js';
import { Ledger } from './ledger.js';
import type { PlanningSnapshot } from './types.js';

function ctxOf(snapshot: PlanningSnapshot = buildSnapshot()): EngineContext {
  return {
    snapshot,
    ledger: Ledger.fromSnapshot(snapshot),
    today: snapshot.asOf,
  };
}

const uk2 = (over: Partial<CourseToStaff> = {}): CourseToStaff => ({
  id: 'P1',
  courseTypeId: 'UK-2',
  locationId: 'RUP',
  language: Language.De,
  cohortId: null,
  dates: ['2027-03-01', '2027-03-02', '2027-03-03', '2027-03-04'],
  ...over,
});

const uk1 = (over: Partial<CourseToStaff> = {}): CourseToStaff => ({
  id: 'P2',
  courseTypeId: 'UK-1',
  locationId: 'RUP',
  language: Language.De,
  cohortId: null,
  dates: ['2027-02-09'],
  ...over,
});

const ins = (ctx: EngineContext, id: string) =>
  ctx.snapshot.instructors.get(id)!;
const row = (
  result: { hard: { label: string; ok: boolean; reason: string }[] },
  label: string,
) => result.hard.find((h) => h.label === label)!;

describe('checkInstructor', () => {
  it('passes a qualified instructor at the home location with the handoff score', () => {
    const ctx = ctxOf();
    const r = checkInstructor(uk2(), ins(ctx, 'I1'), ctx);
    expect(r.ok).toBe(true);
    expect(r.hard.map((h) => h.label)).toEqual([
      'Status',
      'Skills',
      'Zertifikat',
      'Gerätequalifikation',
      'Sprache',
      'Verfügbarkeit',
    ]);
    expect(r.hard.every((h) => h.ok)).toBe(true);
    // 50 + Heimstandort 30 + festangestellt 5 + Qualifikationspflege offen 10
    expect(r.score).toBe(95);
    expect(r.soft.map((s) => s.text)).toEqual(
      expect.arrayContaining([
        'Heimstandort Rupperswil (+30)',
        'Festangestellt, keine Zusatzkosten (+5)',
        expect.stringMatching(
          /^Qualifikationspflege: braucht noch 2 Kurse dieses Typs in 2027 \(\+10\)$/,
        ),
      ]),
    );
    expect(r.soft.map((s) => s.delta)).toEqual(
      expect.arrayContaining([30, 5, 10]),
    );
  });

  it('adds continuity with the cohort and clamps the score at 100', () => {
    const ctx = ctxOf();
    const r = checkInstructor(uk2({ cohortId: 'C2025' }), ins(ctx, 'I1'), ctx);
    expect(
      r.soft.some(
        (s) => s.text === 'Kontinuität: kennt Jahrgang 2025 EFZ (+10)',
      ),
    ).toBe(true);
    expect(r.score).toBe(100);
  });

  it('fails a certificate that expires during the course and names the first uncovered day', () => {
    const ctx = ctxOf();
    const r = checkInstructor(uk2(), ins(ctx, 'I3'), ctx);
    expect(r.ok).toBe(false);
    expect(row(r, 'Zertifikat')).toEqual({
      label: 'Zertifikat',
      ok: false,
      reason:
        'SUVA Staplerinstruktor läuft ab am 3.3.2027 – Kurstag 4.3. nicht gedeckt',
    });
    expect(row(r, 'Gerätequalifikation').ok).toBe(false);
  });

  it('says «abgelaufen» for a certificate that expired before today', () => {
    const snapshot = buildSnapshot();
    snapshot.instructors.get('I3')!.certificates = [
      { certificateTypeId: 'SUVA', validUntil: '2026-10-01' },
    ];
    const ctx = ctxOf(snapshot);
    expect(
      row(checkInstructor(uk2(), ins(ctx, 'I3'), ctx), 'Zertifikat').reason,
    ).toBe(
      'SUVA Staplerinstruktor abgelaufen am 1.10.2026 – Kurstag 1.3. nicht gedeckt',
    );
  });

  it('fails missing skills and certificates', () => {
    const ctx = ctxOf();
    const r = checkInstructor(uk2(), ins(ctx, 'I2'), ctx);
    expect(row(r, 'Skills')).toEqual({
      label: 'Skills',
      ok: false,
      reason: 'fehlt: stapler',
    });
    expect(row(r, 'Zertifikat')).toEqual({
      label: 'Zertifikat',
      ok: false,
      reason: 'SUVA Staplerinstruktor nicht vorhanden',
    });
    expect(
      row(checkInstructor(uk2(), ins(ctx, 'I1'), ctx), 'Skills').reason,
    ).toBe('stapler');
  });

  it('checks the course language', () => {
    const ctx = ctxOf();
    expect(
      row(
        checkInstructor(
          uk1({ language: Language.Fr, locationId: 'MAR' }),
          ins(ctx, 'I2'),
          ctx,
        ),
        'Sprache',
      ),
    ).toEqual({
      label: 'Sprache',
      ok: true,
      reason: 'spricht Französisch',
    });
    expect(
      row(
        checkInstructor(uk1({ language: Language.It }), ins(ctx, 'I2'), ctx),
        'Sprache',
      ),
    ).toEqual({
      label: 'Sprache',
      ok: false,
      reason: 'spricht kein Italienisch (fr/de)',
    });
  });

  it('fails when the instructor is busy or absent, and tolerates an open request', () => {
    const ctx = ctxOf();
    expect(
      row(
        checkInstructor(uk1({ dates: ['2027-02-02'] }), ins(ctx, 'I1'), ctx),
        'Verfügbarkeit',
      ),
    ).toEqual({
      label: 'Verfügbarkeit',
      ok: false,
      reason: 'bereits eingesetzt: UK-1 Rupperswil KW 5',
    });
    expect(
      row(
        checkInstructor(uk1({ dates: ['2027-03-16'] }), ins(ctx, 'I1'), ctx),
        'Verfügbarkeit',
      ),
    ).toEqual({
      label: 'Verfügbarkeit',
      ok: false,
      reason: 'Ferien 15.3.–19.3.2027 (genehmigt)',
    });
    const open = checkInstructor(uk1(), ins(ctx, 'I3'), ctx);
    expect(row(open, 'Verfügbarkeit')).toEqual({
      label: 'Verfügbarkeit',
      ok: true,
      reason: 'frei – offener Ferienantrag KW 6',
    });
    expect(open.soft).toContainEqual({
      text: 'Offener Ferienantrag KW 6 (−15)',
      delta: -15,
    });
    expect(open.score).toBe(70);
    expect(
      row(checkInstructor(uk1(), ins(ctx, 'I1'), ctx), 'Verfügbarkeit').reason,
    ).toBe('frei an allen Kurstagen');
  });

  it('fails inactive instructors', () => {
    const ctx = ctxOf();
    const r = checkInstructor(uk2(), ins(ctx, 'I4'), ctx);
    expect(r.ok).toBe(false);
    expect(row(r, 'Status')).toEqual({
      label: 'Status',
      ok: false,
      reason: 'inaktiv',
    });
  });

  it('rejects a course without dates', () => {
    const ctx = ctxOf();
    const r = checkInstructor(uk1({ dates: [] }), ins(ctx, 'I1'), ctx);
    expect(r).toEqual({
      ok: false,
      hard: [
        { label: 'Termine', ok: false, reason: 'Kurs hat keine Kurstage' },
      ],
      soft: [],
      score: 0,
    });
  });

  it('scores region, preferred location and avoided pairings', () => {
    const snapshot = buildSnapshot();
    snapshot.instructors.get('I2')!.preferredLocationIds = ['RUP'];
    snapshot.instructors.get('I2')!.avoidInstructorIds = ['I1'];
    const ctx = ctxOf(snapshot);
    const plain = checkInstructor(uk1(), ins(ctx, 'I2'), ctx);
    // 50 − andere Region 10 + bevorzugter Standort 8 + Freelancer 0
    expect(plain.score).toBe(48);
    expect(plain.soft.map((s) => s.text)).toEqual(
      expect.arrayContaining([
        'Andere Region, lange Reise Marly → Rupperswil (−10)',
        'Bevorzugter Standort laut Präferenzen (+8)',
        'Freelancer, Honorar fällt an (±0)',
      ]),
    );
    const paired = checkInstructor(
      uk1({ coInstructorIds: ['I1'] }),
      ins(ctx, 'I2'),
      ctx,
    );
    expect(paired.score).toBe(28);
    expect(paired.soft).toContainEqual({
      text: 'Soll nicht mit I1 Imhof eingesetzt werden (−20)',
      delta: -20,
    });
    const sameRegion = checkInstructor(
      uk1({ locationId: 'BER' }),
      ins(ctx, 'I1'),
      ctx,
    );
    expect(sameRegion.soft).toContainEqual({
      text: 'Gleiche Sprachregion, Reise Rupperswil → Bern (+12)',
      delta: 12,
    });
  });
});

describe('staticallyEligible', () => {
  it('needs status, language, skills and the certificate types', () => {
    const ctx = ctxOf();
    const type = ctx.snapshot.courseTypes.get('UK-2')!;
    expect(
      staticallyEligible(type, Language.De, ins(ctx, 'I1'), ctx.snapshot),
    ).toBe(true);
    expect(
      staticallyEligible(type, Language.Fr, ins(ctx, 'I1'), ctx.snapshot),
    ).toBe(false);
    expect(
      staticallyEligible(type, Language.De, ins(ctx, 'I2'), ctx.snapshot),
    ).toBe(false);
    expect(
      staticallyEligible(type, Language.De, ins(ctx, 'I3'), ctx.snapshot),
    ).toBe(true); // validity is checked per day later
    expect(
      staticallyEligible(type, Language.De, ins(ctx, 'I4'), ctx.snapshot),
    ).toBe(false);
  });
});

describe('rankCandidates', () => {
  it('lists feasible instructors first by score, then the rest', () => {
    const ctx = ctxOf();
    expect(rankCandidates(uk2(), ctx).map((c) => c.instructor.id)).toEqual([
      'I1',
    ]);
    const all = rankCandidates(uk2(), ctx, { includeInfeasible: true });
    expect(all.map((c) => c.instructor.id)).toEqual(['I1', 'I3', 'I4', 'I2']);
    expect(all.map((c) => c.result.ok)).toEqual([true, false, false, false]);
    expect(
      rankCandidates(uk2(), ctx, { includeInfeasible: true, limit: 2 }).map(
        (c) => c.instructor.id,
      ),
    ).toEqual(['I1', 'I3']);
  });

  it('respects the ledger of the run', () => {
    const ctx = ctxOf();
    ctx.ledger.bookInstructor('I1', ['2027-03-02'], 'OTHER');
    expect(rankCandidates(uk2(), ctx)).toEqual([]);
  });

  it('counts a proposed assignment on a cohort course as continuity', () => {
    const snapshot = buildSnapshot();
    snapshot.courses.set('X9', {
      ...snapshot.courses.get('X1')!,
      id: 'X9',
      status: CourseStatus.Demand,
      days: [
        { id: 'X9-1', heldOn: '2027-05-03', roomId: 'T1', locationId: null },
      ],
      assignments: [
        {
          id: 'X9-A',
          instructorId: 'I2',
          role: AssignmentRole.Lead,
          status: AssignmentStatus.Proposed,
        },
      ],
    });
    const ctx = ctxOf(snapshot);
    const r = checkInstructor(
      uk1({ cohortId: 'C2025', language: Language.De }),
      ins(ctx, 'I2'),
      ctx,
    );
    expect(r.soft.some((s) => s.text.startsWith('Kontinuität'))).toBe(true);
  });
});
