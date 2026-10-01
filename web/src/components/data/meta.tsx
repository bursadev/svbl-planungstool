import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Wrapping row of labelled facts for a detail header (code, address, contact, …). */
export function MetaList({ children, className }: { children: ReactNode; className?: string }) {
  return <dl className={cn("flex flex-wrap gap-x-8 gap-y-3", className)}>{children}</dl>;
}

/** One fact: 11px uppercase label above the value. */
export function MetaItem({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm">{children}</dd>
    </div>
  );
}
