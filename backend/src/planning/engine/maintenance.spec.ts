import {
  AssignmentRole,
  AssignmentStatus,
  CourseStatus,
  Language,
} from '../../database/enums.js';
import type { EngineContext } from './check.js';
import { buildSnapshot } from './fixture.js';
import { Ledger } from './ledger.js';
import { maintenanceStatus } from './maintenance.js';
import type { PlanningSnapshot } from './types.js';

function ctxOf(snapshot: PlanningSnapshot = buildSnapshot()): EngineContext {
  return {
    snapshot,
    ledger: Ledger.fromSnapshot(snapshot),
    today: snapshot.asOf,
  };
}

describe('maintenanceStatus', () => {
  it('reports the open courses of every maintenance rule', () => {
    const ctx = ctxOf();
    expect(
      maintenanceStatus(ctx.snapshot.instructors.get('I1')!, 2027, ctx),
    ).toEqual([
      {
        certificateTypeId: 'SUVA',
        name: 'SUVA Staplerinstruktor',
        min: 2,
        taught: 0,
        open: 2,
        ok: false,
        courseTypeIds: ['UK-2'],
      },
    ]);
    expect(
      maintenanceStatus(ctx.snapshot.instructors.get('I2')!, 2027, ctx),
    ).toEqual([]);
  });

  it('counts lead assignments on qualifying courses of the year', () => {
    const snapshot = buildSnapshot();
    const uk2 = (
      id: string,
      heldOn: string,
      status: AssignmentStatus,
      role = AssignmentRole.Lead,
    ) => ({
      id,
      courseTypeId: 'UK-2',
      locationId: 'RUP',
      language: Language.De,
      cohortId: null,
      status: CourseStatus.Confirmed,
      capacity: 20,
      booked: 0,
      planningRunId: null,
      days: [{ id: `${id}-1`, heldOn, roomId: 'H1', locationId: null }],
      assignments: [{ id: `${id}-A`, instructorId: 'I1', role, status }],
      enrolledApprenticeIds: [],
    });
    snapshot.courses.set(
      'Y1',
      uk2('Y1', '2027-04-12', AssignmentStatus.Confirmed),
    );
    snapshot.courses.set(
      'Y2',
      uk2('Y2', '2027-06-14', AssignmentStatus.Proposed),
    );
    snapshot.courses.set(
      'Y3',
      uk2('Y3', '2026-12-14', AssignmentStatus.Confirmed),
    ); // other year
    snapshot.courses.set(
      'Y4',
      uk2(
        'Y4',
        '2027-05-10',
        AssignmentStatus.Confirmed,
        AssignmentRole.Assistant,
      ),
    ); // not lead
    snapshot.courses.set(
      'Y5',
      uk2('Y5', '2027-05-17', AssignmentStatus.Declined),
    );
    const [item] = maintenanceStatus(
      snapshot.instructors.get('I1')!,
      2027,
      ctxOf(snapshot),
    );
    expect(item).toMatchObject({ taught: 2, open: 0, ok: true });
  });
});
