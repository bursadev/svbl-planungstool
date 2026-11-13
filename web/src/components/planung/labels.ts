import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import type { StatusTone } from "@/components/data";
import type { IssueKind, PlanningRun, PlanningRunStage, ReadinessRule } from "@/lib/api/planning-runs";

export const STAGES: PlanningRunStage[] = ["demand", "courses", "staffing", "committed"];

export const STAGE_LABELS: Record<PlanningRunStage, string> = {
  demand: "Bedarf",
  courses: "Kurse & Termine",
  staffing: "Ausbilder",
  committed: "Übernahme",
};

export const READINESS_LABELS: Record<ReadinessRule, string> = {
  time_windows: "Zeitfenster",
  prerequisites: "Voraussetzungen",
  school_days: "Schultage",
  variants: "Varianten",
  semesters: "Semester",
  requirements: "Anforderungen",
  devices: "Geräte",
  availability: "Abwesenheiten",
  uk_locations: "ÜK-Standorte",
  holidays: "Feiertage",
};

export const ISSUE_KIND_LABELS: Record<IssueKind, string> = {
  unplannable: "nicht planbar",
  unstaffed: "ohne Ausbilder",
  below_minimum: "unter Minimum",
  unassigned_apprentice: "Lernende ohne Platz",
};

export const WEEKDAY_SHORT = ["", "Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

/** Index of the furthest stage with data: −1 for a fresh run. */
export function reachedStage(run: PlanningRun): number {
  if (run.status === "committed") return 3;
  const index = STAGES.indexOf(run.stage);
  return index === 0 && run.counts.demandGroups === 0 ? -1 : index;
}

/** «neu» · «in Arbeit» · «übernommen» · «verworfen» with the handoff colours. */
export function runStatus(run: PlanningRun): { label: string; tone: StatusTone } {
  if (run.status === "committed") return { label: "übernommen", tone: "ok" };
  if (run.status === "discarded") return { label: "verworfen", tone: "muted" };
  return reachedStage(run) < 0 ? { label: "neu", tone: "muted" } : { label: "in Arbeit", tone: "accent" };
}

/** «Feb 2027 – Jul 2027» */
export function formatPeriod(startsOn: string, endsOn: string): string {
  const month = (d: string) => format(parseISO(d), "MMM yyyy", { locale: de }).replace(".", "");
  return `${month(startsOn)} – ${month(endsOn)}`;
}

/** The school year a period belongs to: «2026/27» for anything from August 2026 to July 2027. */
export function schoolYearLabel(startsOn: string): string {
  const d = parseISO(startsOn);
  const start = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1;
  return `${start}/${String(start + 1).slice(2)}`;
}

/** Semester periods of a school year: Herbstsemester 1.8.–31.1., Frühlingssemester 1.2.–31.7. */
export function semesterPeriods(schoolYearStart: number): { label: string; periodStartsOn: string; periodEndsOn: string }[] {
  return [
    {
      label: `Herbstsemester ${schoolYearStart}`,
      periodStartsOn: `${schoolYearStart}-08-01`,
      periodEndsOn: `${schoolYearStart + 1}-01-31`,
    },
    {
      label: `Frühlingssemester ${schoolYearStart + 1}`,
      periodStartsOn: `${schoolYearStart + 1}-02-01`,
      periodEndsOn: `${schoolYearStart + 1}-07-31`,
    },
  ];
}

/** «Schule Di+Do», «kein Schultag bekannt» */
export function schoolDaysLabel(blockedWeekdays: number[]): string {
  return blockedWeekdays.length ? `Schule ${blockedWeekdays.map((d) => WEEKDAY_SHORT[d]).join("+")}` : "kein Schultag bekannt";
}
