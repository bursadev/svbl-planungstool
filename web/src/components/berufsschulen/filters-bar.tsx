"use client";

import { UrlSelect, type UrlSelectOption } from "@/components/data/url-select";
import { LANGUAGES, LANGUAGE_LABELS } from "@/lib/labels";

const LANGUAGE_OPTIONS: UrlSelectOption[] = LANGUAGES.map((value) => ({ value, label: LANGUAGE_LABELS[value] }));

/** The `/berufsschulen` selects, all in the URL: `sprache`, `standort` (ÜK-Standort id). */
export function SchoolFiltersBar({ locations }: { locations: { id: string; name: string }[] }) {
  return (
    <>
      <UrlSelect param="sprache" label="Sprache" allLabel="Alle Sprachen" options={LANGUAGE_OPTIONS} />
      <UrlSelect
        param="standort"
        label="ÜK-Standort"
        allLabel="Alle ÜK-Standorte"
        options={locations.map((location) => ({ value: location.id, label: location.name }))}
        className="w-52"
      />
    </>
  );
}
