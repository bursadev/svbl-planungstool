"use client";

import { Suspense, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** Radix `Select` reserves the empty string, so «Alle» needs its own value. */
const ALL = "__all__";

export type UrlSelectOption = { value: string; label: string };

type UrlSelectProps = {
  /** Query parameter the selection is written to; removed for «Alle» or the default value. */
  param: string;
  options: UrlSelectOption[];
  /** Entry that clears the filter, e.g. «Alle Standorte». Omit for selects that always have a value. */
  allLabel?: string;
  /** Option that stands for an absent parameter (e.g. the default track); selecting it removes the parameter. */
  defaultValue?: string;
  /** Accessible name of the field, e.g. «Standort». */
  label: string;
  className?: string;
};

/**
 * Filter select bound to a URL query parameter. Changing it rewrites the URL with `router.replace`,
 * which re-renders the Server Component page with the new filter. A value that is not among the
 * options (a deleted skill, a typo in the URL) falls back to «Alle» or the default. Wrapped in
 * `Suspense` because `useSearchParams` requires it on prerendered pages.
 */
export function UrlSelect(props: UrlSelectProps) {
  return (
    <Suspense fallback={<SelectView {...props} value={props.defaultValue ?? ALL} disabled />}>
      <SyncedSelect {...props} />
    </Suspense>
  );
}

function SyncedSelect(props: UrlSelectProps) {
  const { param, options, defaultValue } = props;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const fallback = defaultValue ?? ALL;
  const requested = searchParams.get(param);
  const value = requested && options.some((option) => option.value === requested) ? requested : fallback;

  function handleChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === fallback) params.delete(param);
    else params.set(param, next);
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  return <SelectView {...props} value={value} onValueChange={handleChange} pending={isPending} />;
}

type SelectViewProps = UrlSelectProps & {
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
        {allLabel !== undefined ? <SelectItem value={ALL}>{allLabel}</SelectItem> : null}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
