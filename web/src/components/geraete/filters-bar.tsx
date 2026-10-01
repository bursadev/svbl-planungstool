"use client";

import { Suspense, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEVICE_MOBILITY_LABELS, DEVICE_STATUS_LABELS } from "@/lib/labels";
import type { PickerOption } from "./labels";

/** URL parameter per filter; the page maps them onto the API's query. */
export const DEVICE_FILTER_PARAMS = {
  deviceTypeId: "typ",
  locationId: "standort",
  mobility: "mobilitaet",
  status: "status",
} as const;

type FilterParam = (typeof DEVICE_FILTER_PARAMS)[keyof typeof DEVICE_FILTER_PARAMS];

/** Radix `Select` cannot hold an empty value, so «Alle» is a sentinel that clears the parameter. */
const ALL = "all";

type FiltersBarProps = {
  deviceTypes: PickerOption[];
  locations: PickerOption[];
};

/**
 * Four selects bound to the URL (`?typ=&standort=&mobilitaet=&status=`); changing one replaces the
 * URL, which re-renders the Server Component page with the new filters. Wrapped in `Suspense` so it
 * also works on prerendered pages.
 */
export function FiltersBar(props: FiltersBarProps) {
  return (
    <Suspense fallback={<FiltersView {...props} values={{}} disabled />}>
      <SyncedFilters {...props} />
    </Suspense>
  );
}

type FilterValues = Partial<Record<FilterParam, string>>;

function SyncedFilters(props: FiltersBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const values: FilterValues = {};
  for (const param of Object.values(DEVICE_FILTER_PARAMS)) {
    const value = searchParams.get(param);
    if (value) values[param] = value;
  }

  function handleChange(param: FilterParam, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value === ALL) next.delete(param);
    else next.set(param, value);
    const query = next.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  return <FiltersView {...props} values={values} onChange={handleChange} pending={isPending} />;
}

type FiltersViewProps = FiltersBarProps & {
  values: FilterValues;
  onChange?: (param: FilterParam, value: string) => void;
  pending?: boolean;
  disabled?: boolean;
};

function FiltersView({ deviceTypes, locations, values, onChange, pending = false, disabled = false }: FiltersViewProps) {
  return (
    <div className="flex flex-wrap items-center gap-2" aria-busy={pending}>
      <FilterSelect
        label="Typ"
        allLabel="Alle Typen"
        value={values.typ}
        options={deviceTypes.map((t) => ({ value: t.id, label: t.name }))}
        onChange={(value) => onChange?.("typ", value)}
        disabled={disabled}
      />
      <FilterSelect
        label="Standort"
        allLabel="Alle Standorte"
        value={values.standort}
        options={locations.map((l) => ({ value: l.id, label: l.name }))}
        onChange={(value) => onChange?.("standort", value)}
        disabled={disabled}
      />
      <FilterSelect
        label="Mobilität"
        allLabel="Alle Mobilitäten"
        value={values.mobilitaet}
        options={Object.entries(DEVICE_MOBILITY_LABELS).map(([value, label]) => ({ value, label }))}
        onChange={(value) => onChange?.("mobilitaet", value)}
        disabled={disabled}
      />
      <FilterSelect
        label="Status"
        allLabel="Alle Status"
        value={values.status}
        options={Object.entries(DEVICE_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
        onChange={(value) => onChange?.("status", value)}
        disabled={disabled}
      />
    </div>
  );
}

type FilterSelectProps = {
  label: string;
  allLabel: string;
  value?: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
};

function FilterSelect({ label, allLabel, value, options, onChange, disabled }: FilterSelectProps) {
  // An unknown value in the URL (stale id) falls back to «Alle» in the control; the page ignores it too.
  const current = value && options.some((option) => option.value === value) ? value : ALL;
  return (
    <Select value={current} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger aria-label={label} className="w-44 bg-card">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
