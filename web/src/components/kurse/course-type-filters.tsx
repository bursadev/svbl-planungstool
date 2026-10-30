"use client";

import { UrlSelect } from "@/components/data/url-select";
import { TRACK_LABELS } from "@/lib/format";
import { COURSE_KIND_LABELS, LANGUAGES, LANGUAGE_LABELS } from "@/lib/labels";

const KIND_OPTIONS = Object.entries(COURSE_KIND_LABELS).map(([value, label]) => ({ value, label }));
const TRACK_OPTIONS = [
  ...Object.entries(TRACK_LABELS).map(([value, label]) => ({ value, label })),
  { value: "keiner", label: "Ohne Lehrgang" },
];
const LANGUAGE_OPTIONS = LANGUAGES.map((value) => ({
  value,
  label: LANGUAGE_LABELS[value],
}));

/** The `/kurse/typen` selects, all in the URL: `?art=`, `?lehrgang=` and `?sprache=`. */
export function CourseTypeFilters() {
  return (
    <>
      <UrlSelect param="art" label="Art" options={KIND_OPTIONS} allLabel="Alle Arten" className="w-40" />
      <UrlSelect param="lehrgang" label="Lehrgang" options={TRACK_OPTIONS} allLabel="Alle Lehrgänge" className="w-44" />
      <UrlSelect param="sprache" label="Sprache" options={LANGUAGE_OPTIONS} allLabel="Alle Sprachen" className="w-40" />
    </>
  );
}
