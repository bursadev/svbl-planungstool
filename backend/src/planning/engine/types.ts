import type {
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

/**
 * The in-memory world the planning engine works on. Plain records, no
 * TypeORM relations: `SnapshotService` builds one per run from the database,
 * `fixture.ts` builds a small one for the unit tests. All dates are ISO
 * strings (`YYYY-MM-DD`); the engine never counts weeks internally.
 */

export type IsoDate = string;

export interface SnapshotLocation {
  id: string;
  code: string;
  name: string;
  languageRegion: Language;
  hostsUk: boolean;
  parallelCourseCapacity: number;
  active: boolean;
}

export interface SnapshotRoom {
  id: string;
  locationId: string;
  name: string;
  kind: RoomKind;
  capacity: number | null;
  active: boolean;
}

export interface SnapshotCourseType {
  id: string;
  code: string;
  name: string;
  kind: CourseKind;
  track: Track | null;
  durationDays: number;
  maySpanWeeks: boolean;
  weekdayRule: WeekdayRule;
  languages: Language[];
  minParticipants: number | null;
  maxParticipants: number;
  requiredSkillIds: string[];
  requiredCertificateTypeIds: string[];
  requiredDevices: { deviceTypeId: string; quantity: number }[];
}

export interface SnapshotModule {
  id: string;
  track: Track;
  courseTypeId: string;
  semester: number;
  sequence: number;
  active: boolean;
  prerequisiteModuleIds: string[];
}

export interface SnapshotCohort {
  id: string;
  track: Track;
  startYear: number;
  label: string;
}

export interface SnapshotTimeWindow {
  id: string;
  curriculumModuleId: string;
  cohortId: string;
  locationId: string | null;
  startsOn: IsoDate;
  endsOn: IsoDate;
}

export interface SnapshotCertificateType {
  id: string;
  code: string;
  name: string;
  maintenanceMinPerYear: number | null;
  maintenanceCourseTypeIds: string[];
}

export interface SnapshotInstructor {
  id: string;
  firstName: string;
  lastName: string;
  employmentType: EmploymentType;
  homeLocationId: string;
  languages: Language[];
  status: InstructorStatus;
  preferredLocationIds: string[];
  avoidInstructorIds: string[];
  skillIds: string[];
  certificates: { certificateTypeId: string; validUntil: IsoDate | null }[];
}

export interface SnapshotAvailability {
  instructorId: string;
  startsOn: IsoDate;
  endsOn: IsoDate;
  kind: AvailabilityKind;
  status: AvailabilityStatus;
}

export interface SnapshotDeviceType {
  id: string;
  code: string;
  name: string;
}

export interface SnapshotDeviceQualification {
  deviceTypeId: string;
  certificateTypeId: string | null;
  skillId: string | null;
}

export interface SnapshotDevice {
  id: string;
  deviceTypeId: string;
  homeLocationId: string;
  mobility: DeviceMobility;
  status: DeviceStatus;
  rentalFrom: IsoDate | null;
  rentalUntil: IsoDate | null;
  moves: { effectiveOn: IsoDate; toLocationId: string }[];
  maintenance: { startsOn: IsoDate; endsOn: IsoDate }[];
}

export interface SnapshotCourseDay {
  id: string;
  heldOn: IsoDate;
  roomId: string | null;
  /** Overrides the course's location for this day; null means the course's. */
  locationId: string | null;
}

export interface SnapshotAssignment {
  id: string;
  instructorId: string;
  role: AssignmentRole;
  status: AssignmentStatus;
}

export interface SnapshotCourse {
  id: string;
  courseTypeId: string;
  locationId: string;
  language: Language;
  cohortId: string | null;
  status: CourseStatus;
  capacity: number;
  /** Enrollments in status registered or confirmed. */
  booked: number;
  planningRunId: string | null;
  days: SnapshotCourseDay[];
  assignments: SnapshotAssignment[];
  enrolledApprenticeIds: string[];
}

export interface SnapshotSchool {
  id: string;
  name: string;
  nearestLocationId: string;
  language: Language;
}

export interface SnapshotClass {
  id: string;
  schoolId: string;
  code: string;
  /** ISO weekdays (Monday = 1) the class is at school in the snapshot's school year. */
  blockedWeekdays: number[];
}

export interface SnapshotApprentice {
  id: string;
  firstName: string;
  lastName: string;
  cohortId: string;
  track: Track;
  language: Language;
  schoolId: string;
  schoolClassId: string | null;
  trainingCompanyId: string | null;
  status: ApprenticeStatus;
  /** Course types with an enrollment registered, confirmed or attended on a non-cancelled course. */
  coveredCourseTypeIds: string[];
}

/** Soft-score deltas of the instructor check; `base` is the starting score. */
export interface EngineWeights {
  base: number;
  homeLocation: number;
  sameRegion: number;
  otherRegion: number;
  preferredLocation: number;
  cohortContinuity: number;
  employee: number;
  openVacationRequest: number;
  maintenanceOpen: number;
  avoidPairing: number;
}

/** The weights of the design handoff; the setting `planning.weights` overrides single keys. */
export const DEFAULT_WEIGHTS: EngineWeights = {
  base: 50,
  homeLocation: 30,
  sameRegion: 12,
  otherRegion: -10,
  preferredLocation: 8,
  cohortContinuity: 10,
  employee: 5,
  openVacationRequest: -15,
  maintenanceOpen: 10,
  avoidPairing: -20,
};

export interface PlanningSnapshot {
  /** The day the snapshot was taken; «today» for every rule. */
  asOf: IsoDate;
  /** Calendar year the school year of the range starts in (2026 for 2026/27). */
  schoolYearStart: number;
  locations: Map<string, SnapshotLocation>;
  rooms: Map<string, SnapshotRoom>;
  courseTypes: Map<string, SnapshotCourseType>;
  modules: Map<string, SnapshotModule>;
  cohorts: Map<string, SnapshotCohort>;
  timeWindows: SnapshotTimeWindow[];
  certificateTypes: Map<string, SnapshotCertificateType>;
  instructors: Map<string, SnapshotInstructor>;
  availabilities: SnapshotAvailability[];
  deviceTypes: Map<string, SnapshotDeviceType>;
  deviceQualifications: SnapshotDeviceQualification[];
  devices: Map<string, SnapshotDevice>;
  courses: Map<string, SnapshotCourse>;
  schools: Map<string, SnapshotSchool>;
  classes: Map<string, SnapshotClass>;
  apprentices: Map<string, SnapshotApprentice>;
  weights: EngineWeights;
  holidays: Set<IsoDate>;
}

export type ReadinessRule =
  | 'time_windows'
  | 'prerequisites'
  | 'school_days'
  | 'variants'
  | 'semesters'
  | 'requirements'
  | 'devices'
  | 'availability'
  | 'uk_locations'
  | 'holidays';

export interface ReadinessItem {
  rule: ReadinessRule;
  /** `skipped`: the rule has no data and passes everything; `warning`: data gaps the planner should know. */
  status: 'ok' | 'warning' | 'skipped';
  count: number;
  message: string;
  details?: string[];
}

/** Stored on the planning run when it is created (`planning_run.readiness`). */
export interface ReadinessReport {
  checkedAt: string;
  items: ReadinessItem[];
}

/** What the demand step found besides the groups; stored on the run (`planning_run.demand_summary`). */
export interface DemandSummary {
  generatedAt: string;
  /** Apprentices with an uncovered module of an earlier semester; counted, not planned (decision 4). */
  catchUps: number;
  skippedVariantModules: string[];
  apprenticesWithoutClass: number;
}
