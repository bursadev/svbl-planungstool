import type { ApprenticeStatus, Gender } from "./api/apprentices";
import type { CourseKind, WeekdayRule } from "./api/course-types";
import type { DeviceCategory } from "./api/device-types";
import type { DeviceMobility, DeviceStatus } from "./api/devices";
import type { AvailabilityKind, AvailabilityStatus, EmploymentType, InstructorStatus } from "./api/instructors";
import type { LocationKind, RoomKind } from "./api/locations";
import type { Language } from "./format";

export { LANGUAGE_LABELS, ROLE_LABELS, TRACK_LABELS } from "./format";

/** German labels for the API's enum values, one map per enum. Status→colour maps stay with their screens. */

/** Fixed order for badges and checkboxes, whatever order the API returns. */
export const LANGUAGES: Language[] = ["de", "fr", "it"];

export const LANGUAGE_SHORT_LABELS: Record<Language, string> = {
  de: "DE",
  fr: "FR",
  it: "IT",
};

export const LOCATION_KIND_LABELS: Record<LocationKind, string> = {
  training_centre: "Ausbildungszentrum",
  customer_site: "Kundenstandort",
};

export const ROOM_KIND_LABELS: Record<RoomKind, string> = {
  theory: "Theorieraum",
  practice_hall: "Praxishalle",
  outdoor: "Aussenfläche",
};

export const DEVICE_CATEGORY_LABELS: Record<DeviceCategory, string> = {
  forklift: "Stapler",
  aerial_platform: "Hebebühne",
  crane: "Kran",
  other: "Andere",
};

export const DEVICE_MOBILITY_LABELS: Record<DeviceMobility, string> = {
  fixed: "fest",
  mobile: "mobil",
  rental: "Miete",
};

export const DEVICE_STATUS_LABELS: Record<DeviceStatus, string> = {
  available: "verfügbar",
  maintenance: "in Wartung",
  retired: "ausgemustert",
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  employee: "Angestellt",
  freelancer: "Freelancer",
};

export const INSTRUCTOR_STATUS_LABELS: Record<InstructorStatus, string> = {
  active: "Aktiv",
  inactive: "Inaktiv",
};

export const AVAILABILITY_KIND_LABELS: Record<AvailabilityKind, string> = {
  vacation: "Ferien",
  training: "Weiterbildung",
  sick: "Krankheit",
  blocked: "Sperre",
  available: "Verfügbar",
};

export const AVAILABILITY_STATUS_LABELS: Record<AvailabilityStatus, string> = {
  requested: "beantragt",
  approved: "genehmigt",
  rejected: "abgelehnt",
};

export const COURSE_KIND_LABELS: Record<CourseKind, string> = {
  uk: "ÜK",
  adult: "Erwachsene",
  exam: "Prüfung",
};

export const WEEKDAY_RULE_LABELS: Record<WeekdayRule, string> = {
  weekdays: "Wochentage",
  saturday: "Samstag",
};

/** ISO weekdays, Monday first. */
export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  1: "Montag",
  2: "Dienstag",
  3: "Mittwoch",
  4: "Donnerstag",
  5: "Freitag",
  6: "Samstag",
  7: "Sonntag",
};

export const WEEKDAY_SHORT_LABELS: Record<Weekday, string> = {
  1: "Mo",
  2: "Di",
  3: "Mi",
  4: "Do",
  5: "Fr",
  6: "Sa",
  7: "So",
};

export const APPRENTICE_STATUS_LABELS: Record<ApprenticeStatus, string> = {
  active: "aktiv",
  finished: "abgeschlossen",
  dropped: "abgebrochen",
};

export const GENDER_LABELS: Record<Gender, string> = {
  m: "männlich",
  f: "weiblich",
  other: "divers",
};
