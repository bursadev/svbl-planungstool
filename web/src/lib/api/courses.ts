import { apiFetch } from "./client";
import type { CourseKind } from "./course-types";
import type { EmploymentType } from "./instructors";
import { withQuery } from "./query";
import type { ApiFetcher } from "./request";
import { fetchPage, type ListPageParams, type Page } from "./tabular";
import type { Language } from "../format";

export type CourseStatus = "demand" | "planned" | "open" | "confirmed" | "running" | "done" | "cancelled";
export type AssignmentRole = "lead" | "assistant" | "backup";
export type AssignmentStatus = "proposed" | "confirmed" | "declined" | "cancelled";
export type StaffingFilter = "unstaffed" | "staffed";

/** The engine's verdict on one instructor for one course: hard rules with reasons, soft score 0–100. */
export type CheckResult = {
  ok: boolean;
  hard: { label: string; ok: boolean; reason: string }[];
  soft: { text: string; delta: number }[];
  score: number;
};

export type CourseInstructorRef = {
  assignmentId: string;
  id: string;
  firstName: string;
  lastName: string;
  role: AssignmentRole;
  status: AssignmentStatus;
};

/** One row of `GET /courses`, sorted by first day unless `sort` says otherwise. */
export type CourseRow = {
  id: string;
  courseType: { id: string; code: string; name: string; kind: CourseKind; durationDays: number };
  location: { id: string; code: string; name: string };
  language: Language;
  status: CourseStatus;
  capacity: number;
  /** Enrollments registered or confirmed. */
  booked: number;
  /** ISO dates; `null` for a course without days. */
  startsOn: string | null;
  endsOn: string | null;
  dayCount: number;
  isoWeek: number | null;
  /** Assignments proposed or confirmed. */
  instructors: CourseInstructorRef[];
  planningRunId: string | null;
  planningIssue: string | null;
  externalRef: string | null;
};

export type AssignedInstructor = {
  id: string;
  firstName: string;
  lastName: string;
  employmentType: EmploymentType;
  homeLocation: { id: string; code: string; name: string };
};

export type CourseAssignment = {
  id: string;
  instructor: AssignedInstructor;
  role: AssignmentRole;
  status: AssignmentStatus;
  score: number | null;
  /** The check taken when the assignment was made; `null` for imported assignments. */
  checkResult: CheckResult | null;
  confirmedAt: string | null;
};

/** `GET /courses/:id`: the row plus days, assignments with their checks and the planning context. */
export type CourseDetail = CourseRow & {
  cohort: { id: string; label: string } | null;
  timeWindow: { id: string; startsOn: string; endsOn: string } | null;
  days: {
    id: string;
    heldOn: string;
    startsAt: string;
    endsAt: string;
    sequence: number;
    room: { id: string; name: string; kind: string } | null;
  }[];
  assignments: CourseAssignment[];
  notes: string | null;
};

/** One ranked instructor of `GET /courses/:id/candidates`. */
export type Candidate = { instructor: AssignedInstructor; result: CheckResult };

export type CourseFilters = ListPageParams & {
  from?: string;
  to?: string;
  locationId?: string;
  courseTypeId?: string;
  kind?: CourseKind;
  status?: CourseStatus;
  language?: Language;
  staffing?: StaffingFilter;
  planningRunId?: string;
  q?: string;
};

export type AutoStaffRequest = { from: string; to: string; locationId?: string; kind?: CourseKind; dryRun?: boolean };

type AutoStaffCourseRef = { courseId: string; code: string; location: string; isoWeek: number | null };

export type AutoStaffReport = {
  dryRun: boolean;
  staffed: (AutoStaffCourseRef & {
    instructor: { id: string; firstName: string; lastName: string };
    score: number;
    candidateCount: number;
  })[];
  unstaffed: (AutoStaffCourseRef & { reason: string })[];
};

export const COURSES_PATH = "/courses";

/** The API query of the list filters, for `listCoursesPage` and links. */
export function courseQuery(filters: CourseFilters): Record<string, string | number | undefined> {
  return {
    from: filters.from,
    to: filters.to,
    locationId: filters.locationId,
    courseTypeId: filters.courseTypeId,
    kind: filters.kind,
    status: filters.status,
    language: filters.language,
    staffing: filters.staffing,
    planningRunId: filters.planningRunId,
    q: filters.q,
    page: filters.page,
    pageSize: filters.pageSize,
    sort: filters.sort,
    dir: filters.dir,
  };
}

export function listCoursesPage(filters: CourseFilters, fetcher: ApiFetcher = apiFetch): Promise<Page<CourseRow>> {
  return fetchPage<CourseRow>(withQuery(COURSES_PATH, courseQuery(filters)), fetcher);
}

export function getCourse(id: string, fetcher: ApiFetcher = apiFetch): Promise<CourseDetail> {
  return fetcher<CourseDetail>(`${COURSES_PATH}/${encodeURIComponent(id)}`);
}

/** Feasible instructors ranked by score (default 6); `all` adds the infeasible ones with their violated rules. */
export function listCandidates(
  id: string,
  options: { limit?: number; all?: boolean } = {},
  fetcher: ApiFetcher = apiFetch,
): Promise<Candidate[]> {
  return fetcher<Candidate[]>(
    withQuery(`${COURSES_PATH}/${encodeURIComponent(id)}/candidates`, {
      limit: options.limit,
      all: options.all ? "true" : undefined,
    }),
  );
}

export function checkInstructor(id: string, instructorId: string, fetcher: ApiFetcher = apiFetch): Promise<CheckResult> {
  return fetcher<CheckResult>(
    `${COURSES_PATH}/${encodeURIComponent(id)}/check/${encodeURIComponent(instructorId)}`,
  );
}

/**
 * Proposes the instructor for the course. A violated hard rule is a 409 whose `details.checkResult`
 * carries the reasons; `force: true` writes the assignment anyway.
 */
export function assignInstructor(
  id: string,
  dto: { instructorId: string; role?: "lead" | "assistant"; force?: boolean },
  fetcher: ApiFetcher = apiFetch,
): Promise<CourseAssignment> {
  return fetcher<CourseAssignment>(`${COURSES_PATH}/${encodeURIComponent(id)}/assignments`, {
    method: "POST",
    body: dto,
  });
}

export function confirmAssignment(assignmentId: string, fetcher: ApiFetcher = apiFetch): Promise<CourseAssignment> {
  return fetcher<CourseAssignment>(`/assignments/${encodeURIComponent(assignmentId)}/confirm`, { method: "POST" });
}

export function removeAssignment(assignmentId: string, fetcher: ApiFetcher = apiFetch): Promise<void> {
  return fetcher<void>(`/assignments/${encodeURIComponent(assignmentId)}`, { method: "DELETE" });
}

/** Staffs the unstaffed courses of a range with the engine's best candidates; `dryRun` only reports. */
export function autoStaff(dto: AutoStaffRequest, fetcher: ApiFetcher = apiFetch): Promise<AutoStaffReport> {
  return fetcher<AutoStaffReport>(`${COURSES_PATH}/staff`, { method: "POST", body: dto });
}
