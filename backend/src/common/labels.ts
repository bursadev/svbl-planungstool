import {
  ApprenticeStatus,
  CourseKind,
  DeviceCategory,
  DeviceMobility,
  DeviceStatus,
  EmploymentType,
  Gender,
  InstructorStatus,
  Language,
  LocationKind,
  RoomKind,
  Track,
  WeekdayRule,
} from '../database/enums.js';

/**
 * German labels of the enum values as the CSV files show them. Same wording
 * as `web/src/lib/labels.ts`, so a file reads like the screen it came from.
 */

export const LANGUAGE_LABELS: Record<Language, string> = {
  [Language.De]: 'Deutsch',
  [Language.Fr]: 'Französisch',
  [Language.It]: 'Italienisch',
};

export const TRACK_LABELS: Record<Track, string> = {
  [Track.Efz]: 'EFZ',
  [Track.Eba]: 'EBA',
};

export const LOCATION_KIND_LABELS: Record<LocationKind, string> = {
  [LocationKind.TrainingCentre]: 'Ausbildungszentrum',
  [LocationKind.CustomerSite]: 'Kundenstandort',
};

export const ROOM_KIND_LABELS: Record<RoomKind, string> = {
  [RoomKind.Theory]: 'Theorieraum',
  [RoomKind.PracticeHall]: 'Praxishalle',
  [RoomKind.Outdoor]: 'Aussenfläche',
};

export const DEVICE_CATEGORY_LABELS: Record<DeviceCategory, string> = {
  [DeviceCategory.Forklift]: 'Stapler',
  [DeviceCategory.AerialPlatform]: 'Hebebühne',
  [DeviceCategory.Crane]: 'Kran',
  [DeviceCategory.Other]: 'Andere',
};

export const DEVICE_MOBILITY_LABELS: Record<DeviceMobility, string> = {
  [DeviceMobility.Fixed]: 'fest',
  [DeviceMobility.Mobile]: 'mobil',
  [DeviceMobility.Rental]: 'Miete',
};

export const DEVICE_STATUS_LABELS: Record<DeviceStatus, string> = {
  [DeviceStatus.Available]: 'verfügbar',
  [DeviceStatus.Maintenance]: 'in Wartung',
  [DeviceStatus.Retired]: 'ausgemustert',
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  [EmploymentType.Employee]: 'Angestellt',
  [EmploymentType.Freelancer]: 'Freelancer',
};

export const INSTRUCTOR_STATUS_LABELS: Record<InstructorStatus, string> = {
  [InstructorStatus.Active]: 'Aktiv',
  [InstructorStatus.Inactive]: 'Inaktiv',
};

export const COURSE_KIND_LABELS: Record<CourseKind, string> = {
  [CourseKind.Uk]: 'ÜK',
  [CourseKind.Adult]: 'Erwachsene',
  [CourseKind.Exam]: 'Prüfung',
};

export const WEEKDAY_RULE_LABELS: Record<WeekdayRule, string> = {
  [WeekdayRule.Weekdays]: 'Wochentage',
  [WeekdayRule.Saturday]: 'Samstag',
};

export const APPRENTICE_STATUS_LABELS: Record<ApprenticeStatus, string> = {
  [ApprenticeStatus.Active]: 'aktiv',
  [ApprenticeStatus.Finished]: 'abgeschlossen',
  [ApprenticeStatus.Dropped]: 'abgebrochen',
};

export const GENDER_LABELS: Record<Gender, string> = {
  [Gender.M]: 'männlich',
  [Gender.F]: 'weiblich',
  [Gender.Other]: 'divers',
};
