import {
  ApprenticeStatus,
  AssignmentRole,
  AssignmentStatus,
  AvailabilityKind,
  AvailabilityStatus,
  CourseKind,
  CourseStatus,
  DeviceMobility,
  DeviceStatus,
  EmploymentType,
  InstructorStatus,
  Language,
  RoomKind,
  Track,
  WeekdayRule,
} from '../../database/enums.js';
import { publicHolidays } from './calendar.js';
import {
  DEFAULT_WEIGHTS,
  type PlanningSnapshot,
  type SnapshotApprentice,
  type SnapshotCourseType,
  type SnapshotInstructor,
} from './types.js';

/**
 * One small world for the engine's unit tests, as of 2026-11-13, planning
 * the spring semester 2027 (period 2027-02-01 … 2027-07-31):
 *
 * - Locations RUP (de, ÜK, 2 parallel courses), MAR (fr, ÜK, 1), BER (de, no ÜK).
 * - Course types UK-1 (1 day, max 12), UK-2 (4 days, max 20, skill «stapler»,
 *   certificate SUVA, 2 forklifts), UK-V (variant «üK 5.1.D EFZ»), AD-1 (adult,
 *   2 Saturdays). Modules UK-1 (semester 4), UK-2 (semester 4, needs UK-1),
 *   UK-V (semester 5). Cohort 2025 EFZ with a time window for UK-1 only.
 * - School S1 (→ RUP) with classes K1 (Monday) and K2 (Tuesday, Thursday),
 *   school S2 (→ MAR) with class F1 (Friday). 20 + 10 + 2 (no class) + 6 apprentices.
 * - Instructors I1 (RUP, employee, qualified), I2 (MAR, freelancer, fr/de, no
 *   skills), I3 (RUP, SUVA expires 2027-03-03), I4 (inactive).
 * - Existing courses X1 (UK-1 at RUP on 2027-02-02, I1) and X2 (AD-1, unstaffed).
 */
export function buildSnapshot(
  overrides: Partial<PlanningSnapshot> = {},
): PlanningSnapshot {
  const byId = <T extends { id: string }>(rows: T[]) =>
    new Map(rows.map((row) => [row.id, row]));

  const courseType = (
    partial: Partial<SnapshotCourseType> & Pick<SnapshotCourseType, 'id'>,
  ): SnapshotCourseType => ({
    code: partial.id,
    name: partial.id,
    kind: CourseKind.Uk,
    track: Track.Efz,
    durationDays: 1,
    maySpanWeeks: false,
    weekdayRule: WeekdayRule.Weekdays,
    languages: [Language.De, Language.Fr, Language.It],
    minParticipants: null,
    maxParticipants: 12,
    requiredSkillIds: [],
    requiredCertificateTypeIds: [],
    requiredDevices: [],
    ...partial,
  });

  const instructor = (
    partial: Partial<SnapshotInstructor> & Pick<SnapshotInstructor, 'id'>,
  ): SnapshotInstructor => ({
    firstName: partial.id,
    lastName: 'Test',
    employmentType: EmploymentType.Employee,
    homeLocationId: 'RUP',
    languages: [Language.De],
    status: InstructorStatus.Active,
    preferredLocationIds: [],
    avoidInstructorIds: [],
    skillIds: [],
    certificates: [],
    ...partial,
  });

  const apprentice = (
    id: string,
    schoolId: string,
    schoolClassId: string | null,
    language: Language,
  ): SnapshotApprentice => ({
    id,
    firstName: id,
    lastName: 'Lernende',
    cohortId: 'C2025',
    track: Track.Efz,
    language,
    schoolId,
    schoolClassId,
    trainingCompanyId: null,
    status: ApprenticeStatus.Active,
    coveredCourseTypeIds: id === 'a01' ? ['UK-1'] : [],
  });
  const range = (prefix: string, from: number, to: number) =>
    Array.from(
      { length: to - from + 1 },
      (_, i) => `${prefix}${String(from + i).padStart(2, '0')}`,
    );
  const apprentices = [
    ...range('a', 1, 20).map((id) => apprentice(id, 'S1', 'K1', Language.De)),
    ...range('a', 21, 30).map((id) => apprentice(id, 'S1', 'K2', Language.De)),
    ...range('a', 31, 32).map((id) => apprentice(id, 'S1', null, Language.De)),
    ...range('f', 1, 6).map((id) => apprentice(id, 'S2', 'F1', Language.Fr)),
  ];

  const snapshot: PlanningSnapshot = {
    asOf: '2026-11-13',
    schoolYearStart: 2026,
    locations: byId([
      {
        id: 'RUP',
        code: 'RUP',
        name: 'Rupperswil',
        languageRegion: Language.De,
        hostsUk: true,
        parallelCourseCapacity: 2,
        active: true,
      },
      {
        id: 'MAR',
        code: 'MAR',
        name: 'Marly',
        languageRegion: Language.Fr,
        hostsUk: true,
        parallelCourseCapacity: 1,
        active: true,
      },
      {
        id: 'BER',
        code: 'BER',
        name: 'Bern',
        languageRegion: Language.De,
        hostsUk: false,
        parallelCourseCapacity: 1,
        active: true,
      },
    ]),
    rooms: byId([
      {
        id: 'T1',
        locationId: 'RUP',
        name: 'T1',
        kind: RoomKind.Theory,
        capacity: 12,
        active: true,
      },
      {
        id: 'T2',
        locationId: 'RUP',
        name: 'T2',
        kind: RoomKind.Theory,
        capacity: 24,
        active: true,
      },
      {
        id: 'H1',
        locationId: 'RUP',
        name: 'H1',
        kind: RoomKind.PracticeHall,
        capacity: 20,
        active: true,
      },
      {
        id: 'MT1',
        locationId: 'MAR',
        name: 'MT1',
        kind: RoomKind.Theory,
        capacity: 16,
        active: true,
      },
    ]),
    courseTypes: byId([
      courseType({ id: 'UK-1', name: 'Einführungstag' }),
      courseType({
        id: 'UK-2',
        name: 'Grundkurs Stapler',
        durationDays: 4,
        maxParticipants: 20,
        requiredSkillIds: ['stapler'],
        requiredCertificateTypeIds: ['SUVA'],
        requiredDevices: [{ deviceTypeId: 'forklift', quantity: 2 }],
      }),
      courseType({ id: 'UK-V', code: 'üK 5.1.D EFZ', name: 'Zustellprozesse' }),
      courseType({
        id: 'AD-1',
        kind: CourseKind.Adult,
        track: null,
        durationDays: 2,
        maySpanWeeks: true,
        weekdayRule: WeekdayRule.Saturday,
      }),
    ]),
    modules: byId([
      {
        id: 'M1',
        track: Track.Efz,
        courseTypeId: 'UK-1',
        semester: 4,
        sequence: 401,
        active: true,
        prerequisiteModuleIds: [],
      },
      {
        id: 'M2',
        track: Track.Efz,
        courseTypeId: 'UK-2',
        semester: 4,
        sequence: 402,
        active: true,
        prerequisiteModuleIds: ['M1'],
      },
      {
        id: 'MV',
        track: Track.Efz,
        courseTypeId: 'UK-V',
        semester: 5,
        sequence: 501,
        active: true,
        prerequisiteModuleIds: [],
      },
    ]),
    cohorts: byId([
      { id: 'C2025', track: Track.Efz, startYear: 2025, label: '2025 EFZ' },
    ]),
    timeWindows: [
      {
        id: 'W1',
        curriculumModuleId: 'M1',
        cohortId: 'C2025',
        locationId: null,
        startsOn: '2027-02-01',
        endsOn: '2027-04-30',
      },
    ],
    certificateTypes: byId([
      {
        id: 'SUVA',
        code: 'SUVA',
        name: 'SUVA Staplerinstruktor',
        maintenanceMinPerYear: 2,
        maintenanceCourseTypeIds: ['UK-2'],
      },
    ]),
    instructors: byId([
      instructor({
        id: 'I1',
        lastName: 'Imhof',
        skillIds: ['stapler'],
        certificates: [{ certificateTypeId: 'SUVA', validUntil: '2028-01-01' }],
      }),
      instructor({
        id: 'I2',
        lastName: 'Jaquet',
        employmentType: EmploymentType.Freelancer,
        homeLocationId: 'MAR',
        languages: [Language.Fr, Language.De],
      }),
      instructor({
        id: 'I3',
        lastName: 'Keller',
        skillIds: ['stapler'],
        certificates: [{ certificateTypeId: 'SUVA', validUntil: '2027-03-03' }],
      }),
      instructor({
        id: 'I4',
        lastName: 'Lanz',
        status: InstructorStatus.Inactive,
        skillIds: ['stapler'],
        certificates: [{ certificateTypeId: 'SUVA', validUntil: '2028-01-01' }],
      }),
    ]),
    availabilities: [
      {
        instructorId: 'I1',
        startsOn: '2027-03-15',
        endsOn: '2027-03-19',
        kind: AvailabilityKind.Vacation,
        status: AvailabilityStatus.Approved,
      },
      {
        instructorId: 'I3',
        startsOn: '2027-02-08',
        endsOn: '2027-02-12',
        kind: AvailabilityKind.Vacation,
        status: AvailabilityStatus.Requested,
      },
    ],
    deviceQualifications: [
      { deviceTypeId: 'forklift', certificateTypeId: 'SUVA', skillId: null },
    ],
    devices: byId([
      {
        id: 'D1',
        deviceTypeId: 'forklift',
        homeLocationId: 'RUP',
        mobility: DeviceMobility.Fixed,
        status: DeviceStatus.Available,
        rentalFrom: null,
        rentalUntil: null,
        moves: [],
        maintenance: [],
      },
      {
        id: 'D2',
        deviceTypeId: 'forklift',
        homeLocationId: 'RUP',
        mobility: DeviceMobility.Fixed,
        status: DeviceStatus.Available,
        rentalFrom: null,
        rentalUntil: null,
        moves: [],
        maintenance: [{ startsOn: '2027-03-01', endsOn: '2027-03-05' }],
      },
    ]),
    courses: byId([
      {
        id: 'X1',
        courseTypeId: 'UK-1',
        locationId: 'RUP',
        language: Language.De,
        cohortId: 'C2025',
        status: CourseStatus.Planned,
        capacity: 12,
        booked: 0,
        planningRunId: null,
        days: [
          { id: 'X1-1', heldOn: '2027-02-02', roomId: 'T1', locationId: null },
        ],
        assignments: [
          {
            id: 'X1-A',
            instructorId: 'I1',
            role: AssignmentRole.Lead,
            status: AssignmentStatus.Confirmed,
          },
        ],
        enrolledApprenticeIds: [],
      },
      {
        id: 'X2',
        courseTypeId: 'AD-1',
        locationId: 'RUP',
        language: Language.De,
        cohortId: null,
        status: CourseStatus.Confirmed,
        capacity: 12,
        booked: 8,
        planningRunId: null,
        days: [
          { id: 'X2-1', heldOn: '2027-03-06', roomId: 'T2', locationId: null },
          { id: 'X2-2', heldOn: '2027-03-13', roomId: 'T2', locationId: null },
        ],
        assignments: [],
        enrolledApprenticeIds: [],
      },
    ]),
    schools: byId([
      {
        id: 'S1',
        name: 'BS Aarau',
        nearestLocationId: 'RUP',
        language: Language.De,
      },
      {
        id: 'S2',
        name: 'CPNV',
        nearestLocationId: 'MAR',
        language: Language.Fr,
      },
    ]),
    classes: byId([
      { id: 'K1', schoolId: 'S1', code: 'K1', blockedWeekdays: [1] },
      { id: 'K2', schoolId: 'S1', code: 'K2', blockedWeekdays: [2, 4] },
      { id: 'F1', schoolId: 'S2', code: 'F1', blockedWeekdays: [5] },
    ]),
    apprentices: byId(apprentices),
    weights: { ...DEFAULT_WEIGHTS },
    holidays: new Set([...publicHolidays(2026), ...publicHolidays(2027)]),
  };
  return { ...snapshot, ...overrides };
}
