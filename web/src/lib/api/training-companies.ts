import { apiFetch } from "./client";
import { withQuery } from "./query";
import type { ApiFetcher } from "./request";

/** A Berufsbildner of one Lehrbetrieb. */
export type Trainer = {
  id: string;
  trainingCompanyId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  /** Active apprentices this trainer is responsible for. */
  apprenticeCount: number;
};

/** One row of `GET /training-companies`, sorted by name. */
export type TrainingCompanyRow = {
  id: string;
  name: string;
  addressLine: string | null;
  postalCode: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  /** Reference in OdAOrg. */
  externalRef: string | null;
  trainerCount: number;
  /** Active apprentices employed by this company. */
  apprenticeCount: number;
};

/** `GET /training-companies/:id`: the row plus its Berufsbildner. */
export type TrainingCompany = TrainingCompanyRow & {
  /** Sorted by last name, then first name. */
  trainers: Trainer[];
};

export type CreateTrainingCompany = {
  name: string;
  addressLine?: string | null;
  postalCode?: string | null;
  city?: string | null;
  email?: string | null;
  phone?: string | null;
  externalRef?: string | null;
};

export type UpdateTrainingCompany = Partial<CreateTrainingCompany>;

export type CreateTrainer = {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
};

export type UpdateTrainer = Partial<CreateTrainer>;

/** One row of `GET /trainers`: every Berufsbildner across companies, for pickers. */
export type TrainerListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  trainingCompany: { id: string; name: string };
};

/** All Berufsbildner sorted by name; `q` matches the name. */
export function listTrainers(q?: string, fetcher: ApiFetcher = apiFetch): Promise<TrainerListItem[]> {
  return fetcher<TrainerListItem[]>(withQuery("/trainers", { q }));
}

/**
 * Lehrbetriebe sorted by name; `q` matches name or city. Defaults to the browser client;
 * Server Components pass `serverApiFetch` from `@/lib/api/server`.
 */
export function listTrainingCompanies(
  q?: string,
  fetcher: ApiFetcher = apiFetch,
): Promise<TrainingCompanyRow[]> {
  return fetcher<TrainingCompanyRow[]>(withQuery("/training-companies", { q }));
}

/** One Lehrbetrieb with its Berufsbildner; throws `ApiError` 404 when it does not exist. */
export function getTrainingCompany(id: string, fetcher: ApiFetcher = apiFetch): Promise<TrainingCompany> {
  return fetcher<TrainingCompany>(`/training-companies/${encodeURIComponent(id)}`);
}

export function createTrainingCompany(
  dto: CreateTrainingCompany,
  fetcher: ApiFetcher = apiFetch,
): Promise<TrainingCompany> {
  return fetcher<TrainingCompany>("/training-companies", { method: "POST", body: dto });
}

export function updateTrainingCompany(
  id: string,
  dto: UpdateTrainingCompany,
  fetcher: ApiFetcher = apiFetch,
): Promise<TrainingCompany> {
  return fetcher<TrainingCompany>(`/training-companies/${encodeURIComponent(id)}`, { method: "PATCH", body: dto });
}

/** Hard delete; 409 with a message while trainers or apprentices still reference the company. */
export function deleteTrainingCompany(id: string, fetcher: ApiFetcher = apiFetch): Promise<void> {
  return fetcher<void>(`/training-companies/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function createTrainer(
  companyId: string,
  dto: CreateTrainer,
  fetcher: ApiFetcher = apiFetch,
): Promise<Trainer> {
  return fetcher<Trainer>(`/training-companies/${encodeURIComponent(companyId)}/trainers`, {
    method: "POST",
    body: dto,
  });
}

export function updateTrainer(id: string, dto: UpdateTrainer, fetcher: ApiFetcher = apiFetch): Promise<Trainer> {
  return fetcher<Trainer>(`/trainers/${encodeURIComponent(id)}`, { method: "PATCH", body: dto });
}

/** Hard delete; 409 with a message while apprentices still reference the trainer. */
export function deleteTrainer(id: string, fetcher: ApiFetcher = apiFetch): Promise<void> {
  return fetcher<void>(`/trainers/${encodeURIComponent(id)}`, { method: "DELETE" });
}
