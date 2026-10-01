"use client";

import { Suspense, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** Radix `Select` items cannot carry an empty value, so «alle» travels as this sentinel. */
const ALL = "__all__";

export type UrlSelectOption = { value: string; label: string };

type UrlSelectProps = {
  /** Query parameter the value is written to. */
  param: string;
  options: UrlSelectOption[];
  /** First option that clears the parameter, e.g. «Alle Arten». */
  allLabel?: string;
  /** Value that stands for an absent parameter; selecting it removes the parameter again. */
  defaultValue?: string;
  /** Accessible name of the select. */
  label: string;
  className?: string;
};

/**
 * Filter select bound to a URL query parameter. Selecting a value replaces the URL, which
 * re-renders the Server Component page with the new filter; wrapped in `Suspense` because
 * `useSearchParams` requires it on prerendered pages.
 */
export function UrlSelect(props: UrlSelectProps) {
  return (
    <Suspense fallback={<SelectView {...props} value={props.defaultValue ?? ALL} disabled />}>
      <SyncedUrlSelect {...props} />
    </Suspense>
  );
}

function SyncedUrlSelect(props: UrlSelectProps) {
  const { param, options, defaultValue } = props;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const requested = searchParams.get(param);
  const fallback = defaultValue ?? ALL;
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
