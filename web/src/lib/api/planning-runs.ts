import { apiFetch } from "./client";
import type { ApiFetcher } from "./request";
import type { Language } from "../format";

export type PlanningRunStage = "demand" | "courses" | "staffing" | "committed";
export type PlanningRunStatus = "draft" | "committed" | "discarded";
export type ReadinessRule =
  | "time_windows"
  | "prerequisites"
  | "school_days"
  | "variants"
  | "semesters"
  | "requirements"
  | "devices"
  | "availability"
  | "uk_locations"
  | "holidays";

export type ReadinessItem = {
  rule: ReadinessRule;
  /** `skipped`: the rule has no data and passes everything; `warning`: gaps the planner should know. */
  status: "ok" | "warning" | "skipped";
  count: number;
  message: string;
  details?: string[];
};

export type ReadinessReport = { checkedAt: string; items: ReadinessItem[] };

export type DemandSummary = {
  generatedAt: string;
  /** Apprentices with an uncovered module of an earlier semester (counted, not planned). */
  catchUps: number;
  skippedVariantModules: string[];
  apprenticesWithoutClass: number;
};

export type PlanningRunCounts = {
  demandGroups: number;
  apprentices: number;
  coursesNeeded: number;
  coursesProposed: number;
  coursesUnplannable: number;
  coursesStaffed: number;
  unassignedApprentices: number;
};

/** `GET /planning-runs`: one Planungslauf with the readiness check of its period and the counts of its stages. */
export type PlanningRun = {
  id: string;
  label: string;
  periodStartsOn: string;
  periodEndsOn: string;
  stage: PlanningRunStage;
  status: PlanningRunStatus;
  readiness: ReadinessReport | null;
  demandSummary: DemandSummary | null;
  createdAt: string;
  committedAt: string | null;
  createdBy: string | null;
  counts: PlanningRunCounts;
};

export type PlanningOverview = {
  activeApprentices: number;
  apprenticesWithoutFutureUk: number;
  unstaffedCourses: number;
  modulesWithoutTimeWindow: number;
};

export type CreatePlanningRun = { label?: string; periodStartsOn: string; periodEndsOn: string };

export type DemandRow = {
  id: string;
  cohort: { id: string; label: string };
  module: { id: string; code: string; name: string; semester: number; durationDays: number };
  location: { id: string; code: string; name: string };
  language: Language;
  schoolWeekday: number | null;
  blockedWeekdays: number[];
  window: { startsOn: string; endsOn: string; fromTimeWindow: boolean };
  participantCount: number;
  memberCount: number;
  existingFreeSeats: number;
  coursesNeeded: number;
  note: string | null;
};

export type RunCourse = {
  id: string;
  demandId: string | null;
  courseType: { id: string; code: string; name: string; durationDays: number };
  cohort: { id: string; label: string } | null;
  location: { id: string; code: string; name: string };
  language: Language;
  isoWeek: number | null;
  dates: string[];
  room: { id: string; name: string } | null;
  seats: number;
  booked: number;
  blockedWeekdays: number[];
  planningIssue: string | null;
  reasons: string[];
  proposedInstructor: {
    assignmentId: string;
    id: string;
    firstName: string;
    lastName: string;
    score: number | null;
    why: string;
    candidateCount: number | null;
  } | null;
  staffingIssue: string | null;
};

export type IssueKind = "unplannable" | "unstaffed" | "below_minimum" | "unassigned_apprentice";

export type RunIssue = {
  id: string;
  kind: IssueKind;
  courseKey: string | null;
  demandKey: string | null;
  subject: string;
  problem: string;
  count: number;
};

export type FixOption = {
  index: number;
  title: string;
  why: string;
  effects: string[];
  /** `null`: a hint the planner acts on outside the tool. */
  patch: { kind: "move" | "split" | "assign" } | null;
};

export type CommitSummary = {
  toCreate: number;
  withInstructor: number;
  withoutInstructor: number;
  unplannable: number;
  apprenticesPlaced: number;
  unassigned: number;
};

export type CommitResult = { created: number; withInstructor: number; dropped: number };

const RUNS = "/planning-runs";
const run = (id: string) => `${RUNS}/${encodeURIComponent(id)}`;

export function getPlanningOverview(fetcher: ApiFetcher = apiFetch): Promise<PlanningOverview> {
  return fetcher<PlanningOverview>("/planning/overview");
}

export function listPlanningRuns(fetcher: ApiFetcher = apiFetch): Promise<PlanningRun[]> {
  return fetcher<PlanningRun[]>(RUNS);
}

export function createPlanningRun(dto: CreatePlanningRun, fetcher: ApiFetcher = apiFetch): Promise<PlanningRun> {
  return fetcher<PlanningRun>(RUNS, { method: "POST", body: dto });
}

export function getPlanningRun(id: string, fetcher: ApiFetcher = apiFetch): Promise<PlanningRun> {
  return fetcher<PlanningRun>(run(id));
}

export function discardPlanningRun(id: string, fetcher: ApiFetcher = apiFetch): Promise<void> {
  return fetcher<void>(run(id), { method: "DELETE" });
}

/** Stage 1: (re)generates the demand; drafts of later stages are dropped. */
export function generateDemand(id: string, fetcher: ApiFetcher = apiFetch): Promise<DemandRow[]> {
  return fetcher<DemandRow[]>(`${run(id)}/demand`, { method: "POST" });
}

export function listDemand(id: string, fetcher: ApiFetcher = apiFetch): Promise<DemandRow[]> {
  return fetcher<DemandRow[]>(`${run(id)}/demand`);
}

/** Stage 2: dates, rooms and seats for every demand group. */
export function proposeCourses(id: string, fetcher: ApiFetcher = apiFetch): Promise<RunCourse[]> {
  return fetcher<RunCourse[]>(`${run(id)}/courses`, { method: "POST" });
}

export function listRunCourses(id: string, fetcher: ApiFetcher = apiFetch): Promise<RunCourse[]> {
  return fetcher<RunCourse[]>(`${run(id)}/courses`);
}

/** Stage 3: an instructor proposal for every placed course. */
export function staffRun(id: string, fetcher: ApiFetcher = apiFetch): Promise<RunCourse[]> {
  return fetcher<RunCourse[]>(`${run(id)}/staffing`, { method: "POST" });
}

export function listIssues(id: string, fetcher: ApiFetcher = apiFetch): Promise<RunIssue[]> {
  return fetcher<RunIssue[]>(`${run(id)}/issues`);
}

export function listFixOptions(id: string, courseId: string, fetcher: ApiFetcher = apiFetch): Promise<FixOption[]> {
  return fetcher<FixOption[]>(`${run(id)}/courses/${encodeURIComponent(courseId)}/fix-options`);
}

export function applyFix(id: string, courseId: string, option: number, fetcher: ApiFetcher = apiFetch): Promise<RunCourse[]> {
  return fetcher<RunCourse[]>(`${run(id)}/courses/${encodeURIComponent(courseId)}/fix`, {
    method: "POST",
    body: { option },
  });
}

export function getCommitSummary(id: string, fetcher: ApiFetcher = apiFetch): Promise<CommitSummary> {
  return fetcher<CommitSummary>(`${run(id)}/summary`);
}

export function commitRun(id: string, fetcher: ApiFetcher = apiFetch): Promise<CommitResult> {
  return fetcher<CommitResult>(`${run(id)}/commit`, { method: "POST" });
}
