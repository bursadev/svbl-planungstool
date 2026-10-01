"use client";

import { Suspense, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** Radix `Select` reserves the empty string, so «Alle» needs its own value. */
const ALL = "__all__";

export type UrlSelectOption = { value: string; label: string };

type UrlSelectProps = {
  /** Query parameter the selection is written to; removed for «Alle». */
  param: string;
  options: UrlSelectOption[];
  /** Label of the entry that clears the filter, e.g. «Alle Standorte». */
  allLabel: string;
  /** Accessible name of the field, e.g. «Standort». */
  label: string;
  className?: string;
};

/**
 * Filter select bound to a URL query parameter. Changing it rewrites the URL with `router.replace`,
 * which re-renders the Server Component page with the new filter. A value that is not among the
 * options (a deleted skill, a typo in the URL) shows as «Alle». Wrapped in `Suspense` like `SearchInput`.
 */
export function UrlSelect(props: UrlSelectProps) {
  return (
    <Suspense fallback={<SelectView {...props} value={ALL} disabled />}>
      <SyncedSelect {...props} />
    </Suspense>
  );
}

function SyncedSelect({ param, options, allLabel, label, className }: UrlSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const current = searchParams.get(param);
  const value = current && options.some((option) => option.value === current) ? current : ALL;

  function handleChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === ALL) params.delete(param);
    else params.set(param, next);
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  return (
    <SelectView
      options={options}
      allLabel={allLabel}
      label={label}
      className={className}
      value={value}
      onValueChange={handleChange}
      pending={isPending}
    />
  );
}

type SelectViewProps = Omit<UrlSelectProps, "param"> & {
  value: string;
  onValueChange?: (value: string) => void;
  pending?: boolean;
  disabled?: boolean;
};

function SelectView({ options, allLabel, label, className, value, onValueChange, pending, disabled }: SelectViewProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger aria-label={label} aria-busy={pending} className={cn("bg-card", className)}>
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
