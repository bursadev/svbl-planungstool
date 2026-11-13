import { Language } from '../../database/enums.js';
import type { EngineContext } from './check.js';
import { generateDemand, mergeGroups } from './demand.js';
import { buildSnapshot } from './fixture.js';
import {
  fixOptions,
  validateRun,
  type DraftCourse,
  type RunDrafts,
} from './fixes.js';
import { Ledger } from './ledger.js';
import { proposeCourses } from './propose.js';
import type { PlanningSnapshot } from './types.js';

const FS_2027 = { startsOn: '2027-02-01', endsOn: '2027-07-31' };

function ctxOf(snapshot: PlanningSnapshot = buildSnapshot()): EngineContext {
  return {
    snapshot,
    ledger: Ledger.fromSnapshot(snapshot),
    today: snapshot.asOf,
  };
}

/** The fixture's proposal as drafts, nobody staffed; the ledger holds the placed courses. */
function draftsOf(ctx: EngineContext): RunDrafts {
  const groups = mergeGroups(
    generateDemand(ctx.snapshot, FS_2027).groups,
    ctx.snapshot,
  );
  const result = proposeCourses(groups, ctx, { notBefore: '2027-02-01' });
  return {
    courses: result.courses.map((c): DraftCourse => ({
      ...c,
      instructorId: null,
      staffingIssue: null,
    })),
    groups,
    unassigned: result.unassigned,
  };
}

describe('validateRun', () => {
  it('lists unplannable and unstaffed courses, minimum violations and apprentices without seat', () => {
    const ctx = ctxOf();
    ctx.snapshot.courseTypes.get('UK-1')!.minParticipants = 8;
    const drafts = draftsOf(ctx);
    drafts.courses[1].instructorId = 'I1';
    drafts.unassigned.push({
      apprenticeId: 'a99',
      demandKey: drafts.groups[0].key,
      reason: 'kein Platz mehr in den Kursen der Gruppe',
    });
    const issues = validateRun(drafts, ctx);
    expect(
      issues.filter((i) => i.kind === 'unplannable').map((i) => i.subject),
    ).toEqual(['UK-2 · Marly · 2025 EFZ', 'UK-2 · Rupperswil · 2025 EFZ']);
    expect(issues.filter((i) => i.kind === 'unstaffed')).toHaveLength(4);
    expect(issues.find((i) => i.kind === 'unstaffed')?.problem).toBe(
      'Kein Ausbilder erfüllt alle harten Regeln für diesen Kurs.',
    );
    expect(
      issues.filter((i) => i.kind === 'below_minimum').map((i) => i.problem),
    ).toEqual(['Nur 6 Lernende, Minimum 8']);
    expect(issues.filter((i) => i.kind === 'unassigned_apprentice')).toEqual([
      expect.objectContaining({
        count: 1,
        problem:
          '1 Lernende ohne Platz: kein Platz mehr in den Kursen der Gruppe',
      }),
    ]);
  });
});

describe('fixOptions', () => {
  it('offers another location for a course without a room, and only hints when nothing helps', () => {
    const ctx = ctxOf();
    const drafts = draftsOf(ctx);
    const issues = validateRun(drafts, ctx);
    const marly = issues.find(
      (i) => i.kind === 'unplannable' && i.subject.includes('Marly'),
    )!;
    const options = fixOptions(marly, drafts, ctx, FS_2027);
    expect(options[0]).toMatchObject({
      index: 0,
      title: 'Standort wechseln: Rupperswil',
    });
    expect(options[0].patch).toMatchObject({
      kind: 'move',
      locationId: 'RUP',
      roomId: 'H1',
    });
    expect((options[0].patch as { dates: string[] }).dates).toHaveLength(4);
    expect(options[0].effects[2]).toBe('Reisezeit für die Gruppe steigt');

    const k2 = issues.find(
      (i) => i.kind === 'unplannable' && i.subject.includes('Rupperswil'),
    )!;
    expect(
      fixOptions(k2, drafts, ctx, FS_2027).map((o) => [o.title, o.patch]),
    ).toEqual([['Kein automatischer Ausweg', null]]);
  });

  it('splits a long course when two shorter blocks fit', () => {
    const snapshot = buildSnapshot();
    // A class at school on Wednesday: no 4-day block, but 2 + 2 (Mon–Tue, Thu–Fri) fit.
    snapshot.classes.get('K2')!.blockedWeekdays = [3];
    const ctx = ctxOf(snapshot);
    const drafts = draftsOf(ctx);
    const issue = validateRun(drafts, ctx).find(
      (i) => i.kind === 'unplannable' && i.subject.includes('Rupperswil'),
    )!;
    const split = fixOptions(issue, drafts, ctx, FS_2027).find((o) =>
      o.title.startsWith('Kurs teilen'),
    )!;
    expect(split.title).toBe('Kurs teilen: 2 + 2 Tage über zwei Wochen');
    expect(split.patch).toMatchObject({ kind: 'split' });
    const parts = (split.patch as { parts: { dates: string[] }[] }).parts;
    expect(parts.map((p) => p.dates.length)).toEqual([2, 2]);
    expect(parts[1].dates[0] > parts[0].dates[1]).toBe(true);
  });

  it('offers a language switch for a course nobody can teach in its language', () => {
    const ctx = ctxOf();
    const drafts = draftsOf(ctx);
    const course = drafts.courses.find(
      (c) => c.courseTypeId === 'UK-1' && c.locationId === 'MAR',
    )!;
    course.language = Language.It;
    const issue = validateRun(drafts, ctx).find(
      (i) => i.courseKey === course.key,
    )!;
    const options = fixOptions(issue, drafts, ctx, FS_2027);
    expect(options.map((o) => o.title)).toEqual([
      'Kurssprache auf Deutsch wechseln',
      'Kurssprache auf Französisch wechseln',
    ]);
    expect(options[0].patch).toMatchObject({
      kind: 'move',
      language: 'de',
      instructorId: 'I2',
      dates: course.dates,
    });
  });

  it('offers a week move and a certificate refresh for an unstaffed forklift course', () => {
    const ctx = ctxOf();
    const drafts = draftsOf(ctx);
    const course = drafts.courses.find(
      (c) => c.courseTypeId === 'UK-2' && c.issue === null,
    )!;
    // Put the course into I1's vacation week; I3's certificate has expired by then.
    course.dates = ['2027-03-15', '2027-03-16', '2027-03-17', '2027-03-18'];
    const issue = validateRun(drafts, ctx).find(
      (i) => i.courseKey === course.key,
    )!;
    const titles = fixOptions(issue, drafts, ctx, FS_2027).map((o) => o.title);
    expect(titles).toContain('Zertifikat auffrischen: I3 Keller');
    expect(titles.some((t) => t.startsWith('Woche verschieben: KW '))).toBe(
      true,
    );
  });
});
