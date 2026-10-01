"use client";

import { TRACK_LABELS } from "@/lib/format";
import { COURSE_KIND_LABELS } from "@/lib/labels";
import { UrlSelect } from "@/components/data/url-select";

const KIND_OPTIONS = Object.entries(COURSE_KIND_LABELS).map(([value, label]) => ({ value, label }));
const TRACK_OPTIONS = [
  ...Object.entries(TRACK_LABELS).map(([value, label]) => ({ value, label })),
  { value: "keiner", label: "Ohne Lehrgang" },
];
const ACTIVE_OPTIONS = [
  { value: "ja", label: "Aktiv" },
  { value: "nein", label: "Inaktiv" },
];

/** Filter row of `/kurse/typen`: `?art=`, `?lehrgang=` and `?aktiv=` in the URL. */
export function CourseTypeFilters() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <UrlSelect param="art" label="Art" options={KIND_OPTIONS} allLabel="Alle Arten" className="w-40" />
      <UrlSelect param="lehrgang" label="Lehrgang" options={TRACK_OPTIONS} allLabel="Alle Lehrgänge" className="w-44" />
      <UrlSelect param="aktiv" label="Status" options={ACTIVE_OPTIONS} allLabel="Aktiv und inaktiv" className="w-44" />
    </div>
  );
}
