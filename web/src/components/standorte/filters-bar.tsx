"use client";

import { UrlSelect, type UrlSelectOption } from "@/components/data/url-select";
import { LANGUAGES, LANGUAGE_LABELS, LOCATION_KIND_LABELS } from "@/lib/labels";

const KIND_OPTIONS: UrlSelectOption[] = Object.entries(LOCATION_KIND_LABELS).map(([value, label]) => ({
  value,
  label,
}));
const LANGUAGE_OPTIONS: UrlSelectOption[] = LANGUAGES.map((value) => ({ value, label: LANGUAGE_LABELS[value] }));
const UK_OPTIONS: UrlSelectOption[] = [
  { value: "ja", label: "Mit ÜK" },
  { value: "nein", label: "Ohne ÜK" },
];

/** The `/standorte` selects, all in the URL: `art`, `sprache`, `uek`, `kanton`. */
export function LocationFiltersBar({ cantons }: { cantons: string[] }) {
  return (
    <>
      <UrlSelect param="art" label="Art" allLabel="Alle Arten" options={KIND_OPTIONS} className="w-48" />
      <UrlSelect param="sprache" label="Sprachregion" allLabel="Alle Sprachen" options={LANGUAGE_OPTIONS} />
      <UrlSelect param="uek" label="ÜK" allLabel="ÜK und ohne" options={UK_OPTIONS} />
      {cantons.length ? (
        <UrlSelect
          param="kanton"
          label="Kanton"
          allLabel="Alle Kantone"
          options={cantons.map((canton) => ({ value: canton, label: canton }))}
        />
      ) : null}
    </>
  );
}
