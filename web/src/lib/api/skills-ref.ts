import { apiFetch } from "./client";
import type { ApiFetcher } from "./request";

/**
 * The subset of `GET /skills` the Ausbilder pickers need. The full Skill type and its CRUD live in
 * `skills.ts` (Kataloge slice).
 */
export type SkillRef = { id: string; name: string; active: boolean };

/** All skills sorted by name, inactive ones included; pickers filter on `active`. */
export function listSkillRefs(fetcher: ApiFetcher = apiFetch): Promise<SkillRef[]> {
  return fetcher<SkillRef[]>("/skills");
}
