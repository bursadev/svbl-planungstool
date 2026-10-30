"use client";

import { UrlSelect, type UrlSelectOption } from "@/components/data/url-select";
import type { Skill } from "@/lib/api/skills";
import { EMPLOYMENT_TYPE_LABELS, LANGUAGES, LANGUAGE_LABELS } from "@/lib/labels";
import type { LocationOption } from "./options";

const LANGUAGE_OPTIONS: UrlSelectOption[] = LANGUAGES.map((value) => ({ value, label: LANGUAGE_LABELS[value] }));
const EMPLOYMENT_OPTIONS: UrlSelectOption[] = Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));
const CERTIFICATE_STATUS_OPTIONS: UrlSelectOption[] = [
  { value: "gueltig", label: "Gültig" },
  { value: "laeuft_ab", label: "Läuft ab" },
  { value: "abgelaufen", label: "Abgelaufen" },
];

type FiltersBarProps = {
  skills: Skill[];
  locations: LocationOption[];
  certificateTypes: { id: string; name: string }[];
};

/**
 * The `/ausbilder` selects, all in the URL: `skill`, `sprache`, `standort`, `anstellung`,
 * `zertifikat` and `zertifikatsstatus`. The page reads them back and maps them onto the API query.
 */
export function FiltersBar({ skills, locations, certificateTypes }: FiltersBarProps) {
  return (
    <>
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
      {certificateTypes.length ? (
        <UrlSelect
          param="zertifikat"
          label="Zertifikatstyp"
          allLabel="Alle Zertifikate"
          options={certificateTypes.map((type) => ({ value: type.id, label: type.name }))}
          className="w-56"
        />
      ) : null}
      <UrlSelect
        param="zertifikatsstatus"
        label="Zertifikatsstatus"
        allLabel="Jeder Zertifikatsstatus"
        options={CERTIFICATE_STATUS_OPTIONS}
      />
    </>
  );
}
