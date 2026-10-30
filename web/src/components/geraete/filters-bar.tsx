"use client";

import { UrlSelect, type UrlSelectOption } from "@/components/data/url-select";
import { DEVICE_MOBILITY_LABELS, DEVICE_STATUS_LABELS } from "@/lib/labels";
import type { PickerOption } from "./labels";

const MOBILITY_OPTIONS: UrlSelectOption[] = Object.entries(DEVICE_MOBILITY_LABELS).map(([value, label]) => ({
  value,
  label,
}));
// «ausgemustert» is the archive: the `ArchiveFilter` next to these selects shows retired devices.
const STATUS_OPTIONS: UrlSelectOption[] = (["available", "maintenance"] as const).map((value) => ({
  value,
  label: DEVICE_STATUS_LABELS[value],
}));

type FiltersBarProps = {
  deviceTypes: PickerOption[];
  locations: PickerOption[];
};

/**
 * The `/geraete` selects, all in the URL: `typ`, `standort` (home location), `mobilitaet`,
 * `status`. Changing one starts again on the first page.
 */
export function FiltersBar({ deviceTypes, locations }: FiltersBarProps) {
  return (
    <>
      <UrlSelect
        param="typ"
        label="Typ"
        allLabel="Alle Typen"
        options={deviceTypes.map((t) => ({ value: t.id, label: t.name }))}
        className="w-44"
      />
      <UrlSelect
        param="standort"
        label="Standort"
        allLabel="Alle Standorte"
        options={locations.map((l) => ({ value: l.id, label: l.name }))}
        className="w-44"
      />
      <UrlSelect
        param="mobilitaet"
        label="Mobilität"
        allLabel="Alle Mobilitäten"
        options={MOBILITY_OPTIONS}
        className="w-44"
      />
      <UrlSelect param="status" label="Status" allLabel="Alle Status" options={STATUS_OPTIONS} className="w-40" />
    </>
  );
}
