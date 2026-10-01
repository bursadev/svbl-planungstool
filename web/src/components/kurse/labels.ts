import type { CourseKind, CourseType, WeekdayRule } from "@/lib/api/course-types";
import { LANGUAGE_LABELS } from "@/lib/format";

export const COURSE_KIND_LABELS: Record<CourseKind, string> = {
  uk: "ÜK",
  adult: "Erwachsene",
  exam: "Prüfung",
};

export const WEEKDAY_RULE_LABELS: Record<WeekdayRule, string> = {
  weekdays: "Wochentage",
  saturday: "Samstag",
};

/** «2 Tage · Sa–Sa · wochenübergreifend»; the two qualifiers only when they apply. */
export function formatDuration(type: Pick<CourseType, "durationDays" | "weekdayRule" | "maySpanWeeks">): string {
  const parts = [`${type.durationDays} ${type.durationDays === 1 ? "Tag" : "Tage"}`];
  if (type.weekdayRule === "saturday") parts.push("Sa–Sa");
  if (type.maySpanWeeks) parts.push("wochenübergreifend");
  return parts.join(" · ");
}

/** «6–12», or «bis 12» without a minimum. */
export function formatParticipants(min: number | null, max: number): string {
  return min === null ? `bis ${max}` : `${min}–${max}`;
}

/** «Deutsch, Französisch» in the API's order. */
export function formatLanguages(languages: CourseType["languages"]): string {
  return languages.map((language) => LANGUAGE_LABELS[language]).join(", ");
}

/** «Semester 3 · ÜK-Modul 5» for a type that fills a Bildungsplan slot. */
export function formatModuleSlot(slot: { semester: number; sequence: number }): string {
  return `Semester ${slot.semester} · ÜK-Modul ${slot.sequence}`;
}
