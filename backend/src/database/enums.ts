/**
 * Fixed value sets of the domain, each mapped to one PostgreSQL enum type.
 * The `enumName` used in the column decorators is the snake_case constant
 * next to each enum, so several tables can share one database type.
 * See docs/superpowers/specs/2026-10-01-data-model-design.md, section Enums.
 */

export enum Language {
  De = 'de',
  Fr = 'fr',
  It = 'it',
}
export const LANGUAGE_ENUM = 'language';

export enum Track {
  Efz = 'efz',
  Eba = 'eba',
}
export const TRACK_ENUM = 'track';

export enum UserRole {
  Planner = 'planner',
  Sales = 'sales',
  Management = 'management',
  Instructor = 'instructor',
  Trainer = 'trainer',
  Admin = 'admin',
}
export const USER_ROLE_ENUM = 'user_role';

export enum UserStatus {
  Active = 'active',
  Disabled = 'disabled',
}
export const USER_STATUS_ENUM = 'user_status';

export enum LocationKind {
  TrainingCentre = 'training_centre',
  CustomerSite = 'customer_site',
}
export const LOCATION_KIND_ENUM = 'location_kind';

export enum RoomKind {
  Theory = 'theory',
  PracticeHall = 'practice_hall',
  Outdoor = 'outdoor',
}
export const ROOM_KIND_ENUM = 'room_kind';

export enum DeviceCategory {
  Forklift = 'forklift',
  AerialPlatform = 'aerial_platform',
  Crane = 'crane',
  Other = 'other',
}
export const DEVICE_CATEGORY_ENUM = 'device_category';

export enum DeviceMobility {
  Fixed = 'fixed',
  Mobile = 'mobile',
  Rental = 'rental',
}
export const DEVICE_MOBILITY_ENUM = 'device_mobility';

export enum DeviceStatus {
  Available = 'available',
  Maintenance = 'maintenance',
  Retired = 'retired',
}
export const DEVICE_STATUS_ENUM = 'device_status';

export enum EmploymentType {
  Employee = 'employee',
  Freelancer = 'freelancer',
}
export const EMPLOYMENT_TYPE_ENUM = 'employment_type';

export enum InstructorStatus {
  Active = 'active',
  Inactive = 'inactive',
}
export const INSTRUCTOR_STATUS_ENUM = 'instructor_status';

export enum AvailabilityKind {
  Vacation = 'vacation',
  Training = 'training',
  Sick = 'sick',
  Blocked = 'blocked',
  Available = 'available',
}
export const AVAILABILITY_KIND_ENUM = 'availability_kind';

export enum AvailabilityStatus {
  Requested = 'requested',
  Approved = 'approved',
  Rejected = 'rejected',
}
export const AVAILABILITY_STATUS_ENUM = 'availability_status';

export enum AvailabilitySource {
  Manual = 'manual',
  Request = 'request',
  Import = 'import',
}
export const AVAILABILITY_SOURCE_ENUM = 'availability_source';

export enum CourseKind {
  Uk = 'uk',
  Adult = 'adult',
  Exam = 'exam',
}
export const COURSE_KIND_ENUM = 'course_kind';

export enum WeekdayRule {
  Weekdays = 'weekdays',
  Saturday = 'saturday',
}
export const WEEKDAY_RULE_ENUM = 'weekday_rule';

export enum CourseStatus {
  Demand = 'demand',
  Planned = 'planned',
  Open = 'open',
  Confirmed = 'confirmed',
  Running = 'running',
  Done = 'done',
  Cancelled = 'cancelled',
}
export const COURSE_STATUS_ENUM = 'course_status';

export enum AssignmentRole {
  Lead = 'lead',
  Assistant = 'assistant',
  Backup = 'backup',
}
export const ASSIGNMENT_ROLE_ENUM = 'assignment_role';

export enum AssignmentStatus {
  Proposed = 'proposed',
  Confirmed = 'confirmed',
  Declined = 'declined',
  Cancelled = 'cancelled',
}
export const ASSIGNMENT_STATUS_ENUM = 'assignment_status';

export enum Gender {
  M = 'm',
  F = 'f',
  Other = 'other',
}
export const GENDER_ENUM = 'gender';

export enum ApprenticeStatus {
  Active = 'active',
  Finished = 'finished',
  Dropped = 'dropped',
}
export const APPRENTICE_STATUS_ENUM = 'apprentice_status';

export enum EnrollmentStatus {
  Registered = 'registered',
  Confirmed = 'confirmed',
  Attended = 'attended',
  NoShow = 'no_show',
  Cancelled = 'cancelled',
  Rescheduled = 'rescheduled',
}
export const ENROLLMENT_STATUS_ENUM = 'enrollment_status';

export enum EnrollmentChannel {
  Planner = 'planner',
  Trainer = 'trainer',
  Import = 'import',
}
export const ENROLLMENT_CHANNEL_ENUM = 'enrollment_channel';

export enum AttendanceStatus {
  Present = 'present',
  Absent = 'absent',
  Excused = 'excused',
}
export const ATTENDANCE_STATUS_ENUM = 'attendance_status';

export enum PlanningRunStage {
  Demand = 'demand',
  Courses = 'courses',
  Staffing = 'staffing',
  Committed = 'committed',
}
export const PLANNING_RUN_STAGE_ENUM = 'planning_run_stage';

export enum PlanningRunStatus {
  Draft = 'draft',
  Committed = 'committed',
  Discarded = 'discarded',
}
export const PLANNING_RUN_STATUS_ENUM = 'planning_run_status';

export enum DemandSource {
  SchoolImport = 'school_import',
  SalesForecast = 'sales_forecast',
  Manual = 'manual',
}
export const DEMAND_SOURCE_ENUM = 'demand_source';

export enum DemandStatus {
  Open = 'open',
  Planned = 'planned',
  Dropped = 'dropped',
}
export const DEMAND_STATUS_ENUM = 'demand_status';

export enum AlertKind {
  CertificateExpiring = 'certificate_expiring',
  CertificateExpired = 'certificate_expired',
  ResourceBottleneck = 'resource_bottleneck',
  UnstaffedCourse = 'unstaffed_course',
  DeviceConflict = 'device_conflict',
  DuplicateApprentice = 'duplicate_apprentice',
  ImportError = 'import_error',
  MaintenanceRule = 'maintenance_rule',
}
export const ALERT_KIND_ENUM = 'alert_kind';

export enum AlertSeverity {
  Info = 'info',
  Warning = 'warning',
  Critical = 'critical',
}
export const ALERT_SEVERITY_ENUM = 'alert_severity';

export enum AlertStatus {
  Open = 'open',
  Acknowledged = 'acknowledged',
  Resolved = 'resolved',
}
export const ALERT_STATUS_ENUM = 'alert_status';

export enum ImportSource {
  PlanningExcel = 'planning_excel',
  SchoolExport = 'school_export',
  Manual = 'manual',
}
export const IMPORT_SOURCE_ENUM = 'import_source';

export enum ImportBatchStatus {
  Uploaded = 'uploaded',
  Previewed = 'previewed',
  Applied = 'applied',
  Failed = 'failed',
}
export const IMPORT_BATCH_STATUS_ENUM = 'import_batch_status';

export enum ValidationIssueStatus {
  Open = 'open',
  Merged = 'merged',
  Dismissed = 'dismissed',
}
export const VALIDATION_ISSUE_STATUS_ENUM = 'validation_issue_status';
