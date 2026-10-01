import type { CourseKind } from "@/lib/api/course-types";
import type { Track } from "@/lib/format";

type Param = string | string[] | undefined;

/** Next hands repeated query keys over as arrays; the pages only ever use the first value. */
export function firstParam(value: Param): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return first?.trim() || undefined;
}

export function parseTrack(value: Param): Track | undefined {
  const first = firstParam(value);
  return first === "efz" || first === "eba" ? first : undefined;
}

/** `?lehrgang=` on the Kurstypen page also accepts `keiner` for types without a Lehrgang. */
export function parseTrackFilter(value: Param): Track | "none" | undefined {
  const first = firstParam(value);
  return first === "keiner" ? "none" : parseTrack(first);
}

export function parseKind(value: Param): CourseKind | undefined {
  const first = firstParam(value);
  return first === "uk" || first === "adult" || first === "exam" ? first : undefined;
}

/** `?aktiv=ja|nein`; anything else means «alle». */
export function parseActive(value: Param): boolean | undefined {
  const first = firstParam(value);
  if (first === "ja") return true;
  if (first === "nein") return false;
  return undefined;
}
