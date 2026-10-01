import { format, getISOWeek, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import type { UserRole } from "./roles";

/** A `Date` or an ISO 8601 string (`2026-10-01` or a full timestamp). */
export type DateInput = Date | string;

function toDate(value: DateInput): Date {
  return typeof value === "string" ? parseISO(value) : value;
}

/** Swiss short date: `1.10.2026`. */
export function formatDate(value: DateInput): string {
  return format(toDate(value), "d.M.yyyy");
}

/** Short date with two-letter German weekday: `Do 1.10.2026`. */
export function formatDateWithWeekday(value: DateInput): string {
  return format(toDate(value), "EEEEEE d.M.yyyy", { locale: de });
}

/** ISO 8601 week number (weeks start on Monday): 40 for 1.10.2026. */
export function isoWeek(value: DateInput): number {
  return getISOWeek(toDate(value));
}

/** ISO week as shown in the UI: `KW 40`. */
export function formatIsoWeek(value: DateInput): string {
  return `KW ${isoWeek(value)}`;
}

export type Language = "de" | "fr" | "it";

export const LANGUAGE_LABELS: Record<Language, string> = {
  de: "Deutsch",
  fr: "Französisch",
  it: "Italienisch",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  planner: "Planung",
  sales: "Sales",
  management: "Geschäftsleitung",
  instructor: "Ausbilder",
  trainer: "Berufsbildner",
  admin: "Admin",
};

export type Track = "efz" | "eba";

export const TRACK_LABELS: Record<Track, string> = {
  efz: "EFZ",
  eba: "EBA",
};

/** `Hauptstrasse 1, 5102 Rupperswil`; parts that are missing are left out, empty when nothing is set. */
export function formatAddress(address: {
  addressLine?: string | null;
  postalCode?: string | null;
  city?: string | null;
}): string {
  const place = [address.postalCode, address.city].filter(Boolean).join(" ");
  return [address.addressLine, place].filter(Boolean).join(", ");
}
