import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import type { RunCourse } from "@/lib/api/planning-runs";

/** «Mi 3.3.2027», «Mi–Do 3.3.–4.3.2027», «Mo–Di 1.3. + Do–Fr 4.3.2027» for two blocks; «–» without dates. */
export function formatCourseDates(dates: string[]): string {
  if (dates.length === 0) return "–";
  const blocks: string[][] = [];
  for (const date of dates) {
    const last = blocks.at(-1);
    const previous = last?.at(-1);
    if (last && previous && (parseISO(date).getTime() - parseISO(previous).getTime()) / 864e5 <= 1) last.push(date);
    else blocks.push([date]);
  }
  const wd = (d: string) => format(parseISO(d), "EEEEEE", { locale: de });
  const dm = (d: string) => format(parseISO(d), "d.M.");
  const parts = blocks.map((block, index) => {
    const first = block[0];
    const last = block[block.length - 1];
    const tail = index === blocks.length - 1 ? format(parseISO(last), "d.M.yyyy") : dm(last);
    return block.length === 1 ? `${wd(first)} ${tail}` : `${wd(first)}–${wd(last)} ${dm(first)}–${tail}`;
  });
  return parts.join(" + ");
}

/** «üK 2.0 EFZ · Rupperswil · KW 10 · 2025 EFZ» */
export function courseSubject(course: RunCourse): string {
  return [course.courseType.code, course.location.name, course.isoWeek === null ? null : `KW ${course.isoWeek}`, course.cohort?.label]
    .filter(Boolean)
    .join(" · ");
}
