import type { ComponentProps, ReactNode } from "react";
import { Table, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { EmptyState } from "./empty-state";

/**
 * Card-framed table in the handoff density: 11px uppercase head, `py-2.5` rows, 13px cells.
 * Compose with `TableHeader`, `TableBody` and `TableRow` from `@/components/ui/table`.
 */
export function DataTable({ className, ...props }: ComponentProps<typeof Table>) {
  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <Table className={cn("text-[13px]", className)} {...props} />
    </div>
  );
}

export function DataTableHead({ className, ...props }: ComponentProps<typeof TableHead>) {
  return (
    <TableHead
      className={cn(
        "h-auto px-4 py-2.5 text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function DataTableCell({ className, ...props }: ComponentProps<typeof TableCell>) {
  return <TableCell className={cn("px-4 py-2.5", className)} {...props} />;
}

/** One full-width row with the empty-state text, e.g. «Keine Standorte gefunden.» */
export function DataTableEmpty({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="p-0 whitespace-normal">
        <EmptyState>{children}</EmptyState>
      </TableCell>
    </TableRow>
  );
}
