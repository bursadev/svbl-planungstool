import { apiFetch } from "./client";
import { withQuery } from "./query";
import type { ApiFetcher } from "./request";
import { fetchPage, type ListPageParams, type Page } from "./tabular";

/** `GET /skills`: sorted by name. */
export type Skill = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  active: boolean;
};

export type CreateSkill = {
  name: string;
  category?: string | null;
  description?: string | null;
  active?: boolean;
};

export type UpdateSkill = Partial<CreateSkill>;

export function listSkills(fetcher: ApiFetcher = apiFetch): Promise<Skill[]> {
  return fetcher<Skill[]>("/skills");
}

/** Filters of `GET /skills` and its CSV export; `q` matches name, category and description. */
export type SkillFilters = ListPageParams & { q?: string };

export const SKILLS_PATH = "/skills";

/** Skills matching the filters with the total, for the Kataloge tab (all rows unless `page` is set). */
export function listSkillsPage(filters: SkillFilters, fetcher: ApiFetcher = apiFetch): Promise<Page<Skill>> {
  return fetchPage<Skill>(withQuery(SKILLS_PATH, filters), fetcher);
}

export function createSkill(dto: CreateSkill, fetcher: ApiFetcher = apiFetch): Promise<Skill> {
  return fetcher<Skill>("/skills", { method: "POST", body: dto });
}

export function updateSkill(id: string, dto: UpdateSkill, fetcher: ApiFetcher = apiFetch): Promise<Skill> {
  return fetcher<Skill>(`/skills/${encodeURIComponent(id)}`, { method: "PATCH", body: dto });
}

/** Hard delete; the backend answers 409 with a message while the Skill is still referenced. */
export function deleteSkill(id: string, fetcher: ApiFetcher = apiFetch): Promise<void> {
  return fetcher<void>(`/skills/${encodeURIComponent(id)}`, { method: "DELETE" });
}
