"use client";

import { SearchInput } from "@/components/data";
import { UrlSelect, type UrlSelectOption } from "@/components/data/url-select";
import type { SkillRef } from "@/lib/api/skills-ref";
import { EMPLOYMENT_TYPE_LABELS, INSTRUCTOR_STATUS_LABELS, LANGUAGES, LANGUAGE_LABELS } from "./labels";
import type { LocationOption } from "./options";

const LANGUAGE_OPTIONS: UrlSelectOption[] = LANGUAGES.map((value) => ({ value, label: LANGUAGE_LABELS[value] }));
const EMPLOYMENT_OPTIONS: UrlSelectOption[] = Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));
const STATUS_OPTIONS: UrlSelectOption[] = Object.entries(INSTRUCTOR_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

type FiltersBarProps = {
  skills: SkillRef[];
  locations: LocationOption[];
};

/**
 * The `/ausbilder` filters, all in the URL: `q`, `skill`, `sprache`, `standort`, `anstellung`,
 * `status`. The page reads them back and maps them onto the API query.
 */
export function FiltersBar({ skills, locations }: FiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput placeholder="Name oder E-Mail" className="w-64" />
      <UrlSelect
        param="skill"
        label="Skill"
        allLabel="Alle Skills"
        options={skills.map((skill) => ({ value: skill.id, label: skill.name }))}
      />
      <UrlSelect param="sprache" label="Sprache" allLabel="Alle Sprachen" options={LANGUAGE_OPTIONS} />
      <UrlSelect
        param="standort"
        label="Standort"
        allLabel="Alle Standorte"
        options={locations.map((location) => ({ value: location.id, label: location.name }))}
      />
      <UrlSelect param="anstellung" label="Anstellung" allLabel="Alle Anstellungen" options={EMPLOYMENT_OPTIONS} />
      <UrlSelect param="status" label="Status" allLabel="Alle Status" options={STATUS_OPTIONS} />
    </div>
  );
}
