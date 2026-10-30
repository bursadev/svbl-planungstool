"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NON_FILTER_PARAMS } from "@/lib/list-params";

/** «Filter zurücksetzen», shown while any filter is in the URL; keeps sorting, page size and tab. */
export function ResetFilters() {
  return (
    <Suspense fallback={null}>
      <SyncedReset />
    </Suspense>
  );
}

function SyncedReset() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const kept = new URLSearchParams();
  let filtered = false;
  for (const [key, value] of searchParams) {
    if (key === "seite") continue;
    if (NON_FILTER_PARAMS.includes(key)) kept.set(key, value);
    else if (value) filtered = true;
  }
  if (!filtered) return null;
  const query = kept.toString();
  return (
    <Button variant="ghost" size="sm" asChild>
      <Link href={query ? `${pathname}?${query}` : pathname} replace scroll={false}>
        <XIcon data-icon="inline-start" />
        Filter zurücksetzen
      </Link>
    </Button>
  );
}
