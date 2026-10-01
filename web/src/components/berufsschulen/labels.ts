import type { SchoolClassDay } from "@/lib/api/vocational-schools";

/** ISO weekdays in the order the Schultage dialog lists them. */
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

/** `2026/27` for the school year that starts in August 2026. */
export function formatSchoolYear(start: number): string {
  return `${start}/${String(start + 1).slice(-2)}`;
}

/** The school year runs August to July: October 2026 → 2026, March 2027 → 2026. */
export function currentSchoolYearStart(today: Date = new Date()): number {
  return today.getMonth() >= 7 ? today.getFullYear() : today.getFullYear() - 1;
}

function shortWeekday(weekday: number): string {
  return WEEKDAY_SHORT_LABELS[weekday as Weekday] ?? String(weekday);
}

/** One line per school year, oldest first: `2026/27: Di, Do (abends)`. Empty when the class has no days. */
export function formatClassDays(days: SchoolClassDay[]): string[] {
  const byYear = new Map<number, SchoolClassDay[]>();
  for (const day of days) {
    const list = byYear.get(day.schoolYearStart) ?? [];
    list.push(day);
    byYear.set(day.schoolYearStart, list);
  }
  return [...byYear.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, list]) => {
      const parts = [...list]
        .sort((a, b) => a.weekday - b.weekday)
        .map((day) => `${shortWeekday(day.weekday)}${day.evening ? " (abends)" : ""}`);
      return `${formatSchoolYear(year)}: ${parts.join(", ")}`;
    });
}
