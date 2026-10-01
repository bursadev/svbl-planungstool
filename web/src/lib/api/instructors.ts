import { apiFetch } from "./client";
import { withQuery } from "./query";
import type { ApiFetcher } from "./request";
import type { Language } from "../format";

export type EmploymentType = "employee" | "freelancer";
export type InstructorStatus = "active" | "inactive";
export type CertificateStatus = "valid" | "expiring" | "expired";
export type AvailabilityKind = "vacation" | "training" | "sick" | "blocked" | "available";
export type AvailabilityStatus = "requested" | "approved" | "rejected";
export type AvailabilitySource = "manual" | "request" | "import";

/** Free-form planning preferences; `PATCH /instructors/:id` replaces the whole object. */
export type InstructorPreferences = {
  preferredLocationIds?: string[];
  avoidInstructorIds?: string[];
  notes?: string;
};

export type InstructorLocationRef = { id: string; code: string; name: string };
export type InstructorSkillRef = { id: string; name: string };

/** One row of `GET /instructors`, sorted by last name. */
export type InstructorRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  employmentType: EmploymentType;
  languages: Language[];
  status: InstructorStatus;
  homeLocation: InstructorLocationRef;
  skills: InstructorSkillRef[];
};

/** A certificate with its type and the status derived for today (`warningLeadDays` of the type). */
export type InstructorCertificate = {
  id: string;
  certificateType: { id: string; code: string; name: string; issuer: string | null; warningLeadDays: number };
  issuedOn: string;
  validUntil: string | null;
  documentUrl: string | null;
  notes: string | null;
  status: CertificateStatus;
  /** Days until `validUntil` (negative when expired); `null` for certificates that never expire. */
  daysLeft: number | null;
};

export type Availability = {
  id: string;
  instructorId: string;
  startsOn: string;
  endsOn: string;
  kind: AvailabilityKind;
  status: AvailabilityStatus;
  source: AvailabilitySource;
  requestedByUserId: string | null;
  decidedByUserId: string | null;
  decidedAt: string | null;
  note: string | null;
};

/** `GET /instructors/:id`: the row plus planning data, certificates (by validity) and availabilities (newest first). */
export type Instructor = InstructorRow & {
  weeklyHours: number | null;
  overtimeCapHours: number | null;
  costRate: number | null;
  maxTravelMinutes: number | null;
  preferences: InstructorPreferences | null;
  externalRef: string | null;
  certificates: InstructorCertificate[];
  availabilities: Availability[];
};

export type InstructorFilters = {
  /** Matches first name, last name or e-mail. */
  q?: string;
  skillId?: string;
  language?: Language;
  /** Instructors whose home location this is. */
  locationId?: string;
  employmentType?: EmploymentType;
  status?: InstructorStatus;
};

export type CreateInstructor = {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  employmentType: EmploymentType;
  homeLocationId: string;
  /** At least one. */
  languages: Language[];
  weeklyHours?: number | null;
  overtimeCapHours?: number | null;
  costRate?: number | null;
  maxTravelMinutes?: number | null;
  preferences?: InstructorPreferences | null;
  externalRef?: string | null;
  status?: InstructorStatus;
};

export type UpdateInstructor = Partial<CreateInstructor>;

export type CreateCertificate = {
  certificateTypeId: string;
  issuedOn: string;
  /** Omitted: computed from the type's validity years; `null`: never expires. */
  validUntil?: string | null;
  documentUrl?: string | null;
  notes?: string | null;
};

export type UpdateCertificate = Partial<CreateCertificate>;

export type CreateAvailability = {
  startsOn: string;
  endsOn: string;
  kind: AvailabilityKind;
  /** Planners may set it; omitted: `vacation` → `requested`, everything else → `approved`. */
  status?: AvailabilityStatus;
  note?: string | null;
};

export type UpdateAvailability = Partial<CreateAvailability>;

const instructorPath = (id: string) => `/instructors/${encodeURIComponent(id)}`;

/**
 * Ausbilder sorted by last name. Defaults to the browser client; Server Components pass
 * `serverApiFetch` from `@/lib/api/server`.
 */
export function listInstructors(
  filters: InstructorFilters = {},
  fetcher: ApiFetcher = apiFetch,
): Promise<InstructorRow[]> {
  return fetcher<InstructorRow[]>(withQuery("/instructors", filters));
}

/** One Ausbilder with skills, certificates and availabilities; throws `ApiError` 404 when unknown. */
export function getInstructor(id: string, fetcher: ApiFetcher = apiFetch): Promise<Instructor> {
  return fetcher<Instructor>(instructorPath(id));
}

export function createInstructor(dto: CreateInstructor, fetcher: ApiFetcher = apiFetch): Promise<Instructor> {
  return fetcher<Instructor>("/instructors", { method: "POST", body: dto });
}

export function updateInstructor(
  id: string,
  dto: UpdateInstructor,
  fetcher: ApiFetcher = apiFetch,
): Promise<Instructor> {
  return fetcher<Instructor>(instructorPath(id), { method: "PATCH", body: dto });
}

/** Hard delete including skills, certificates and availabilities; 409 while assignments reference the Ausbilder. */
export function deleteInstructor(id: string, fetcher: ApiFetcher = apiFetch): Promise<void> {
  return fetcher<void>(instructorPath(id), { method: "DELETE" });
}

/** Replaces the whole skill set. */
export function replaceInstructorSkills(
  id: string,
  skillIds: string[],
  fetcher: ApiFetcher = apiFetch,
): Promise<Instructor> {
  return fetcher<Instructor>(`${instructorPath(id)}/skills`, { method: "PUT", body: { skillIds } });
}

export function createCertificate(
  instructorId: string,
  dto: CreateCertificate,
  fetcher: ApiFetcher = apiFetch,
): Promise<InstructorCertificate> {
  return fetcher<InstructorCertificate>(`${instructorPath(instructorId)}/certificates`, {
    method: "POST",
    body: dto,
  });
}

export function updateCertificate(
  id: string,
  dto: UpdateCertificate,
  fetcher: ApiFetcher = apiFetch,
): Promise<InstructorCertificate> {
  return fetcher<InstructorCertificate>(`/instructor-certificates/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: dto,
  });
}

export function deleteCertificate(id: string, fetcher: ApiFetcher = apiFetch): Promise<void> {
  return fetcher<void>(`/instructor-certificates/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function createAvailability(
  instructorId: string,
  dto: CreateAvailability,
  fetcher: ApiFetcher = apiFetch,
): Promise<Availability> {
  return fetcher<Availability>(`${instructorPath(instructorId)}/availabilities`, { method: "POST", body: dto });
}

export function updateAvailability(
  id: string,
  dto: UpdateAvailability,
  fetcher: ApiFetcher = apiFetch,
): Promise<Availability> {
  return fetcher<Availability>(`/availabilities/${encodeURIComponent(id)}`, { method: "PATCH", body: dto });
}

export function deleteAvailability(id: string, fetcher: ApiFetcher = apiFetch): Promise<void> {
  return fetcher<void>(`/availabilities/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** 409 «Der Antrag ist bereits entschieden.» unless the availability is still `requested`. */
export function approveAvailability(id: string, fetcher: ApiFetcher = apiFetch): Promise<Availability> {
  return fetcher<Availability>(`/availabilities/${encodeURIComponent(id)}/approve`, { method: "POST", body: {} });
}

export function rejectAvailability(id: string, fetcher: ApiFetcher = apiFetch): Promise<Availability> {
  return fetcher<Availability>(`/availabilities/${encodeURIComponent(id)}/reject`, { method: "POST", body: {} });
}
