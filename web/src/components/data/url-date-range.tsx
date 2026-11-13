"use client";

import { Suspense, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type UrlDateRangeProps = {
  /** Query parameters of the two dates, e.g. `von` and `bis`. */
  fromParam: string;
  toParam: string;
  /** Values shown while the parameters are absent (the list's default range). */
  defaultFrom?: string;
  defaultTo?: string;
  className?: string;
};

/**
 * Two date inputs bound to URL query parameters; changing one rewrites the URL (like `UrlSelect`),
 * which re-renders the Server Component page. Clearing an input removes its parameter, so the
 * page falls back to its default.
 */
export function UrlDateRange(props: UrlDateRangeProps) {
  return (
    <Suspense fallback={<RangeView {...props} from={props.defaultFrom ?? ""} to={props.defaultTo ?? ""} disabled />}>
      <SyncedRange {...props} />
    </Suspense>
  );
}

function SyncedRange(props: UrlDateRangeProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function write(param: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("seite");
    if (value) params.set(param, value);
    else params.delete(param);
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  return (
    <RangeView
      {...props}
      from={searchParams.get(props.fromParam) ?? props.defaultFrom ?? ""}
      to={searchParams.get(props.toParam) ?? props.defaultTo ?? ""}
      onChange={write}
      pending={isPending}
    />
  );
}

type RangeViewProps = UrlDateRangeProps & {
  from: string;
  to: string;
  onChange?: (param: string, value: string) => void;
  pending?: boolean;
  disabled?: boolean;
};

function RangeView({ fromParam, toParam, from, to, onChange, pending, disabled, className }: RangeViewProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)} aria-busy={pending}>
      <Input
        type="date"
        aria-label="Von"
        value={from}
        disabled={disabled}
        onChange={(event) => onChange?.(fromParam, event.target.value)}
        className="w-40 bg-card font-mono text-[13px] tabular-nums"
      />
      <span className="text-muted-foreground">–</span>
      <Input
        type="date"
        aria-label="Bis"
        value={to}
        disabled={disabled}
        onChange={(event) => onChange?.(toParam, event.target.value)}
        className="w-40 bg-card font-mono text-[13px] tabular-nums"
      />
    </div>
  );
}
