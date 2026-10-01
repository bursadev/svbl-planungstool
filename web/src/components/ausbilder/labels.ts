import type { StatusTone } from "@/components/data/status-dot";
import type { AvailabilityStatus, CertificateStatus, InstructorCertificate } from "@/lib/api/instructors";

/** Status→colour maps and texts of the Ausbilder screens; enum labels live in `@/lib/labels`. */

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
