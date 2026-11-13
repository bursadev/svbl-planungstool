"use client";

import { UrlSelect, type UrlSelectOption } from "@/components/data/url-select";
import type { Location } from "@/lib/api/locations";
import { COURSE_KIND_LABELS, LANGUAGES, LANGUAGE_LABELS } from "@/lib/labels";
import { COURSE_STATUS_LABELS } from "./course-status";

const KIND_OPTIONS: UrlSelectOption[] = Object.entries(COURSE_KIND_LABELS).map(([value, label]) => ({ value, label }));
const STATUS_OPTIONS: UrlSelectOption[] = Object.entries(COURSE_STATUS_LABELS).map(([value, label]) => ({ value, label }));
const LANGUAGE_OPTIONS: UrlSelectOption[] = LANGUAGES.map((value) => ({ value, label: LANGUAGE_LABELS[value] }));
const STAFFING_OPTIONS: UrlSelectOption[] = [
  { value: "offen", label: "Ohne Ausbilder" },
  { value: "besetzt", label: "Mit Ausbilder" },
];

/**
 * The `/kurse` selects, all in the URL: `standort`, `art`, `status`, `besetzung`, `sprache`.
 * The page reads them back and maps them onto the API query.
 */
export function CoursesFilters({ locations }: { locations: Location[] }) {
  return (
    <>
      <UrlSelect
        param="standort"
        label="Standort"
        allLabel="Alle Standorte"
        options={locations.map((location) => ({ value: location.id, label: location.name }))}
        className="w-52"
      />
      <UrlSelect param="art" label="Art" allLabel="Alle Arten" options={KIND_OPTIONS} />
      <UrlSelect param="status" label="Status" allLabel="Alle Status" options={STATUS_OPTIONS} />
      <UrlSelect param="besetzung" label="Besetzung" allLabel="Jede Besetzung" options={STAFFING_OPTIONS} />
      <UrlSelect param="sprache" label="Sprache" allLabel="Alle Sprachen" options={LANGUAGE_OPTIONS} />
    </>
  );
}
