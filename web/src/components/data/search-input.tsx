"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoaderCircleIcon, SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchInputProps = {
  /** Query parameter the value is written to. */
  param?: string;
  placeholder?: string;
  /** Milliseconds of silence before the URL updates. */
  delay?: number;
  className?: string;
};

/**
 * Search field bound to a URL query parameter (`?q=` by default). Typing updates the URL after a
 * small debounce, which re-renders the Server Component page with the new filter; the input keeps
 * focus and its text across that refresh. Wrapped in `Suspense` so it also works on prerendered pages.
 */
export function SearchInput(props: SearchInputProps) {
  return (
    <Suspense fallback={<SearchField value="" placeholder={props.placeholder} className={props.className} disabled />}>
      <SyncedSearchInput {...props} />
    </Suspense>
  );
}

function SyncedSearchInput({ param = "q", placeholder = "Suchen…", delay = 300, className }: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const current = searchParams.get(param) ?? "";
  const [value, setValue] = useState(current);
  // The last value this component wrote and the last URL value it saw: an external URL change
  // (back/forward, a link) replaces the text, our own debounced write must not clobber newer typing.
  const [pushed, setPushed] = useState(current);
  const [seen, setSeen] = useState(current);
  if (current !== seen) {
    setSeen(current);
    if (current !== pushed) setValue(current);
  }

  useEffect(() => {
    if (value === current) return;
    const timer = setTimeout(() => {
      setPushed(value);
      const next = new URLSearchParams(searchParams.toString());
      if (value) next.set(param, value);
      else next.delete(param);
      const query = next.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    }, delay);
    return () => clearTimeout(timer);
  }, [value, current, delay, param, pathname, router, searchParams, startTransition]);

  return (
    <SearchField
      value={value}
      onChange={setValue}
      placeholder={placeholder}
      className={className}
      pending={isPending}
    />
  );
}

type SearchFieldProps = {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  pending?: boolean;
  disabled?: boolean;
};

function SearchField({ value, onChange, placeholder, className, pending = false, disabled = false }: SearchFieldProps) {
  const Icon = pending ? LoaderCircleIcon : SearchIcon;
  return (
    <div className={cn("relative", className)} aria-busy={pending}>
      <Icon
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground",
          pending && "animate-spin",
        )}
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        disabled={disabled}
        className="bg-card pl-8"
      />
    </div>
  );
}
