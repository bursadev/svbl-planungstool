import { Apprentice } from '../apprentices/apprentice.entity.js';
import { Attendance } from '../apprentices/attendance.entity.js';
import { Enrollment } from '../apprentices/enrollment.entity.js';
import { SchoolClassDay } from '../apprentices/school-class-day.entity.js';
import { SchoolClass } from '../apprentices/school-class.entity.js';
import { SchoolHoliday } from '../apprentices/school-holiday.entity.js';
import { Trainer } from '../apprentices/trainer.entity.js';
import { TrainingCompany } from '../apprentices/training-company.entity.js';
import { VocationalSchool } from '../apprentices/vocational-school.entity.js';
import { Assignment } from '../courses/assignment.entity.js';
import { CourseDay } from '../courses/course-day.entity.js';
import { CourseTypeCertificate } from '../courses/course-type-certificate.entity.js';
import { CourseTypeDevice } from '../courses/course-type-device.entity.js';
import { CourseTypeSkill } from '../courses/course-type-skill.entity.js';
import { CourseType } from '../courses/course-type.entity.js';
import { Course } from '../courses/course.entity.js';
import { Cohort } from '../curriculum/cohort.entity.js';
import { CurriculumModulePrerequisite } from '../curriculum/curriculum-module-prerequisite.entity.js';
import { CurriculumModule } from '../curriculum/curriculum-module.entity.js';
import { TimeWindow } from '../curriculum/time-window.entity.js';
import { Customer } from '../customers/customer.entity.js';
import { Participant } from '../customers/participant.entity.js';
import { DeviceMove } from '../devices/device-move.entity.js';
import { DeviceReservation } from '../devices/device-reservation.entity.js';
import { DeviceTypeQualification } from '../devices/device-type-qualification.entity.js';
import { DeviceType } from '../devices/device-type.entity.js';
import { Device } from '../devices/device.entity.js';
import { MaintenanceWindow } from '../devices/maintenance-window.entity.js';
import { Availability } from '../instructors/availability.entity.js';
import { CertificateTypeMaintenanceCourseType } from '../instructors/certificate-type-maintenance-course-type.entity.js';
import { CertificateType } from '../instructors/certificate-type.entity.js';
import { InstructorCertificate } from '../instructors/instructor-certificate.entity.js';
import { InstructorSkill } from '../instructors/instructor-skill.entity.js';
import { Instructor } from '../instructors/instructor.entity.js';
import { Skill } from '../instructors/skill.entity.js';
import { LocationDistance } from '../locations/location-distance.entity.js';
import { Location } from '../locations/location.entity.js';
import { Room } from '../locations/room.entity.js';
import { Demand } from '../planning/demand.entity.js';
import { PlanningRun } from '../planning/planning-run.entity.js';
import { Alert } from '../system/alert.entity.js';
import { AssistantConversation } from '../system/assistant-conversation.entity.js';
import { AuditEntry } from '../system/audit-entry.entity.js';
import { ImportBatch } from '../system/import-batch.entity.js';
import { Setting } from '../system/setting.entity.js';
import { ValidationIssue } from '../system/validation-issue.entity.js';
import { User } from '../users/user.entity.js';

/**
 * Every entity, listed explicitly so the TypeORM CLI (compiled), the Nest app
 * and vitest (TypeScript sources) load the same set. A glob can't serve all
 * three. `entities.spec.ts` fails when an entity file is missing here.
 */
export const ALL_ENTITIES = [
  User,
  Location,
  Room,
  LocationDistance,
  DeviceType,
  DeviceTypeQualification,
  Device,
  DeviceMove,
  MaintenanceWindow,
  DeviceReservation,
  Skill,
  CertificateType,
  CertificateTypeMaintenanceCourseType,
  Instructor,
  InstructorSkill,
  InstructorCertificate,
  Availability,
  CourseType,
  CourseTypeSkill,
  CourseTypeCertificate,
  CourseTypeDevice,
  Course,
  CourseDay,
  Assignment,
  CurriculumModule,
  CurriculumModulePrerequisite,
  Cohort,
  TimeWindow,
  VocationalSchool,
  SchoolHoliday,
  SchoolClass,
  SchoolClassDay,
  TrainingCompany,
  Trainer,
  Apprentice,
  Enrollment,
  Attendance,
  Customer,
  Participant,
  PlanningRun,
  Demand,
  Alert,
  ImportBatch,
  ValidationIssue,
  AuditEntry,
  AssistantConversation,
  Setting,
];
