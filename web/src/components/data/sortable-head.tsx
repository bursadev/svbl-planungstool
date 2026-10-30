"use client";

import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { DataTableHead } from "./data-table";

type SortableHeadProps = {
  /** The API's sort key for this column. */
  sortKey: string;
  /** The list's order when `?sortierung=` is absent, so its column shows the arrow. */
  defaultSort?: string;
  className?: string;
  children: ReactNode;
};

/**
 * Column head that sorts the list by this column: first click ascending, second descending.
 * Writes `?sortierung=&richtung=ab` and keeps every other parameter except the page.
 */
export function SortableHead(props: SortableHeadProps) {
  return (
    <Suspense fallback={<DataTableHead className={props.className}>{props.children}</DataTableHead>}>
      <SyncedHead {...props} />
    </Suspense>
  );
}

function SyncedHead({ sortKey, defaultSort, className, children }: SortableHeadProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("sortierung") ?? defaultSort;
  const desc = searchParams.get("richtung") === "ab";
  const active = current === sortKey;

  const params = new URLSearchParams(searchParams.toString());
  params.delete("seite");
  params.set("sortierung", sortKey);
  if (active && !desc) params.set("richtung", "ab");
  else params.delete("richtung");
  const Icon = !active ? ArrowUpDownIcon : desc ? ArrowDownIcon : ArrowUpIcon;

  return (
    <DataTableHead
      className={className}
      aria-sort={active ? (desc ? "descending" : "ascending") : undefined}
    >
      <Link
        href={`${pathname}?${params.toString()}`}
        scroll={false}
        replace
        className={cn(
          "inline-flex items-center gap-1 outline-none hover:text-foreground focus-visible:text-foreground",
          active && "text-foreground",
        )}
      >
        {children}
        <Icon aria-hidden className={cn("size-3", !active && "opacity-40")} />
      </Link>
    </DataTableHead>
  );
}
