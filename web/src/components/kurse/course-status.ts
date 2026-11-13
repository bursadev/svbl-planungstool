import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import type { StatusTone } from "@/components/data";
import type { CourseRow, CourseStatus } from "@/lib/api/courses";

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  demand: "Bedarf",
  planned: "geplant",
  open: "offen",
  confirmed: "bestätigt",
  running: "laufend",
  done: "durchgeführt",
  cancelled: "abgesagt",
};

/** Handoff colours: cancelled and done grey, no instructor yellow, planned blue, the rest green. */
export function courseTone(course: Pick<CourseRow, "status" | "instructors">): StatusTone {
  if (course.status === "cancelled" || course.status === "done" || course.status === "demand") return "muted";
  if (course.instructors.length === 0) return "warn";
  if (course.status === "planned") return "accent";
  return "ok";
}

/** «Di 2.3.2027» for one day, «Mo–Do 1.3.–4.3.2027» for a span; «—» without days. */
export function formatDayRange(startsOn: string | null, endsOn: string | null): string {
  if (!startsOn) return "—";
  const start = parseISO(startsOn);
  const end = parseISO(endsOn ?? startsOn);
  const weekday = (d: Date) => format(d, "EEEEEE", { locale: de });
  if (startsOn === endsOn || !endsOn) return `${weekday(start)} ${format(start, "d.M.yyyy")}`;
  return `${weekday(start)}–${weekday(end)} ${format(start, "d.M.")}–${format(end, "d.M.yyyy")}`;
}

/** «Imhof, Keller» or «—». */
export function instructorNames(course: Pick<CourseRow, "instructors">): string {
  return course.instructors.map((i) => i.lastName).join(", ") || "—";
}
