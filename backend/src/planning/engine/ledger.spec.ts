import { CourseStatus, Language } from '../../database/enums.js';
import { buildSnapshot } from './fixture.js';
import { Ledger, type LedgerCourse } from './ledger.js';

const uk2: LedgerCourse = {
  id: 'P1',
  courseTypeId: 'UK-2',
  days: [
    { heldOn: '2027-03-08', locationId: 'RUP', roomId: 'H1' },
    { heldOn: '2027-03-09', locationId: 'RUP', roomId: 'H1' },
  ],
  instructorIds: ['I3'],
  apprenticeIds: ['a21', 'a22'],
};

describe('Ledger', () => {
  it('books the existing courses of the snapshot', () => {
    const ledger = Ledger.fromSnapshot(buildSnapshot());
    expect(ledger.instructorBusyOn('I1', '2027-02-02')).toBe('X1');
    expect(ledger.instructorBusyOn('I1', '2027-02-03')).toBeNull();
    expect(ledger.locationLoad('RUP', '2027-02-02')).toBe(1);
    expect(ledger.locationLoad('RUP', '2027-02-03')).toBe(0);
    expect(ledger.roomBusyOn('T1', '2027-02-02')).toBe('X1');
    expect(ledger.roomBusyOn('T2', '2027-03-13')).toBe('X2');
  });

  it('skips cancelled and done courses and excluded ids', () => {
    const snapshot = buildSnapshot();
    snapshot.courses.set('X3', {
      ...snapshot.courses.get('X1')!,
      id: 'X3',
      status: CourseStatus.Cancelled,
      days: [
        { id: 'X3-1', heldOn: '2027-02-09', roomId: 'T1', locationId: null },
      ],
    });
    const ledger = Ledger.fromSnapshot(snapshot, { exclude: new Set(['X2']) });
    expect(ledger.roomBusyOn('T1', '2027-02-09')).toBeNull();
    expect(ledger.roomBusyOn('T2', '2027-03-06')).toBeNull();
  });

  it('books and releases a course with instructors, room, devices and apprentices', () => {
    const ledger = Ledger.fromSnapshot(buildSnapshot());
    ledger.bookCourse(uk2);
    expect(ledger.instructorBusyOn('I3', '2027-03-09')).toBe('P1');
    expect(ledger.locationLoad('RUP', '2027-03-08')).toBe(1);
    expect(ledger.roomBusyOn('H1', '2027-03-08')).toBe('P1');
    expect(ledger.deviceUse('RUP', 'forklift', '2027-03-08')).toBe(2);
    expect(ledger.apprenticeBusyOn('a21', '2027-03-09')).toBe('P1');

    ledger.releaseCourse('P1');
    expect(ledger.instructorBusyOn('I3', '2027-03-09')).toBeNull();
    expect(ledger.locationLoad('RUP', '2027-03-08')).toBe(0);
    expect(ledger.roomBusyOn('H1', '2027-03-08')).toBeNull();
    expect(ledger.deviceUse('RUP', 'forklift', '2027-03-08')).toBe(0);
    expect(ledger.apprenticeBusyOn('a21', '2027-03-09')).toBeNull();
  });

  it('books instructors and apprentices on their own', () => {
    const ledger = Ledger.fromSnapshot(buildSnapshot());
    ledger.bookInstructor('I2', ['2027-04-06', '2027-04-07'], 'P9');
    ledger.bookApprentices(['f01'], ['2027-04-06'], 'P9');
    expect(ledger.instructorBusyOn('I2', '2027-04-07')).toBe('P9');
    expect(ledger.apprenticeBusyOn('f01', '2027-04-06')).toBe('P9');
    ledger.releaseInstructor('I2', 'P9');
    expect(ledger.instructorBusyOn('I2', '2027-04-07')).toBeNull();
  });

  it('clone leaves the original untouched', () => {
    const ledger = Ledger.fromSnapshot(buildSnapshot());
    const copy = ledger.clone();
    copy.bookCourse(uk2);
    expect(copy.roomBusyOn('H1', '2027-03-08')).toBe('P1');
    expect(ledger.roomBusyOn('H1', '2027-03-08')).toBeNull();
    expect(ledger.deviceUse('RUP', 'forklift', '2027-03-08')).toBe(0);
  });

  it('counts the location load per course, not per day entry', () => {
    const ledger = Ledger.fromSnapshot(buildSnapshot());
    ledger.bookCourse({
      ...uk2,
      id: 'P2',
      instructorIds: [],
      apprenticeIds: [],
    });
    ledger.bookCourse({
      ...uk2,
      id: 'P3',
      days: [{ heldOn: '2027-03-08', locationId: 'MAR', roomId: 'MT1' }],
      instructorIds: [],
      apprenticeIds: [],
    });
    expect(ledger.locationLoad('RUP', '2027-03-08')).toBe(1);
    expect(ledger.locationLoad('MAR', '2027-03-08')).toBe(1);
    expect(Language.De).toBe('de');
  });
});
