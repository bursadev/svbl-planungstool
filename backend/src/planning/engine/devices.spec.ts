import { DeviceMobility, DeviceStatus } from '../../database/enums.js';
import type { EngineContext } from './check.js';
import { deviceCheck, deviceLocationOn } from './devices.js';
import { buildSnapshot } from './fixture.js';
import { Ledger } from './ledger.js';
import type { PlanningSnapshot, SnapshotDevice } from './types.js';

function ctxOf(snapshot: PlanningSnapshot = buildSnapshot()): EngineContext {
  return {
    snapshot,
    ledger: Ledger.fromSnapshot(snapshot),
    today: snapshot.asOf,
  };
}

const device = (over: Partial<SnapshotDevice> = {}): SnapshotDevice => ({
  id: 'D9',
  deviceTypeId: 'forklift',
  homeLocationId: 'RUP',
  mobility: DeviceMobility.Fixed,
  status: DeviceStatus.Available,
  rentalFrom: null,
  rentalUntil: null,
  moves: [],
  maintenance: [],
  ...over,
});

describe('deviceLocationOn', () => {
  it('follows moves, rental periods and retirement', () => {
    expect(deviceLocationOn(device(), '2027-03-01')).toBe('RUP');
    const moved = device({
      mobility: DeviceMobility.Mobile,
      moves: [{ effectiveOn: '2027-04-01', toLocationId: 'MAR' }],
    });
    expect(deviceLocationOn(moved, '2027-03-31')).toBe('RUP');
    expect(deviceLocationOn(moved, '2027-04-01')).toBe('MAR');
    const rental = device({
      mobility: DeviceMobility.Rental,
      rentalFrom: '2027-05-01',
      rentalUntil: '2027-05-31',
    });
    expect(deviceLocationOn(rental, '2027-04-30')).toBeNull();
    expect(deviceLocationOn(rental, '2027-05-10')).toBe('RUP');
    expect(
      deviceLocationOn(device({ status: DeviceStatus.Retired }), '2027-03-01'),
    ).toBeNull();
  });
});

describe('deviceCheck', () => {
  const course = (dates: string[]) => ({
    courseTypeId: 'UK-2',
    locationId: 'RUP',
    dates,
  });

  it('subtracts maintenance and reservations from the stock at the location', () => {
    const ctx = ctxOf();
    expect(
      deviceCheck(
        course(['2027-03-01', '2027-03-02', '2027-03-03', '2027-03-04']),
        ctx,
      ),
    ).toEqual([
      {
        deviceTypeId: 'forklift',
        name: 'Stapler',
        needed: 2,
        total: 2,
        maintenance: 1,
        reserved: 0,
        free: 1,
        ok: false,
      },
    ]);
    expect(
      deviceCheck(course(['2027-03-08', '2027-03-09']), ctx)[0],
    ).toMatchObject({ free: 2, ok: true });
    ctx.ledger.bookCourse({
      id: 'P1',
      courseTypeId: 'UK-2',
      days: [{ heldOn: '2027-03-09', locationId: 'RUP', roomId: 'H1' }],
      instructorIds: [],
      apprenticeIds: [],
    });
    expect(
      deviceCheck(course(['2027-03-08', '2027-03-09']), ctx)[0],
    ).toMatchObject({ reserved: 2, free: 0, ok: false });
  });

  it('returns nothing for course types without devices', () => {
    expect(
      deviceCheck(
        { courseTypeId: 'UK-1', locationId: 'RUP', dates: ['2027-03-01'] },
        ctxOf(),
      ),
    ).toEqual([]);
  });
});
