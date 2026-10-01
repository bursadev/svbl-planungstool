import type { StatusTone } from "@/components/data/status-dot";
import type {
  AvailabilityKind,
  AvailabilityStatus,
  CertificateStatus,
  EmploymentType,
  InstructorCertificate,
  InstructorStatus,
} from "@/lib/api/instructors";
import type { Language } from "@/lib/format";

export { LANGUAGE_LABELS } from "@/lib/format";

/** Fixed order for badges and checkboxes, whatever order the API returns. */
export const LANGUAGES: Language[] = ["de", "fr", "it"];

export const LANGUAGE_SHORT_LABELS: Record<Language, string> = {
  de: "DE",
  fr: "FR",
  it: "IT",
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

export const AVAILABILITY_STATUS_TONES: Record<AvailabilityStatus, StatusTone> = {
  requested: "warn",
  approved: "ok",
  rejected: "muted",
};

export const CERTIFICATE_STATUS_TONES: Record<CertificateStatus, StatusTone> = {
  valid: "ok",
  expiring: "warn",
  expired: "bad",
};

/** «gültig», «läuft ab in 12 Tagen» or «abgelaufen». */
export function certificateStatusLabel({ status, daysLeft }: Pick<InstructorCertificate, "status" | "daysLeft">): string {
  if (status === "expired") return "abgelaufen";
  if (status === "expiring" && daysLeft !== null) {
    return daysLeft === 0 ? "läuft heute ab" : `läuft ab in ${daysLeft} ${daysLeft === 1 ? "Tag" : "Tagen"}`;
  }
  return "gültig";
}
