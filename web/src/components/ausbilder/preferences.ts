import type { InstructorPreferences } from "@/lib/api/instructors";

/**
 * `PATCH /instructors/:id` replaces `preferences` as a whole, so every partial edit (notes,
 * preferred locations) merges into the existing object. Empty values drop their key; an object
 * without keys becomes `null`.
 */
export function mergePreferences(
  existing: InstructorPreferences | null,
  patch: Partial<InstructorPreferences>,
): InstructorPreferences | null {
  const merged: InstructorPreferences = { ...(existing ?? {}), ...patch };
  if (!merged.preferredLocationIds?.length) delete merged.preferredLocationIds;
  if (!merged.avoidInstructorIds?.length) delete merged.avoidInstructorIds;
  if (!merged.notes?.trim()) delete merged.notes;
  return Object.keys(merged).length > 0 ? merged : null;
}
