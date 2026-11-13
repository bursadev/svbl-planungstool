import Link from "next/link";
import { DataTable, DataTableCell, DataTableEmpty, DataTableHead, LinkRow, StatusDot } from "@/components/data";
import { Button } from "@/components/ui/button";
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import type { PlanningRun } from "@/lib/api/planning-runs";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DiscardRunButton } from "./discard-run-button";
import { STAGES, STAGE_LABELS, formatPeriod, reachedStage, runStatus, schoolYearLabel } from "./labels";

const COLUMNS = 5;

/** The runs, newest first: period, school year, four progress dots, status and the actions of the design. */
export function RunsTable({ runs }: { runs: PlanningRun[] }) {
  return (
    <DataTable>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <DataTableHead>Periode</DataTableHead>
          <DataTableHead>Schuljahr</DataTableHead>
          <DataTableHead>Fortschritt</DataTableHead>
          <DataTableHead>Status</DataTableHead>
          <DataTableHead className="text-right">
            <span className="sr-only">Aktionen</span>
          </DataTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {runs.length === 0 ? (
          <DataTableEmpty colSpan={COLUMNS}>Noch kein Planungslauf angelegt.</DataTableEmpty>
        ) : (
          runs.map((run) => {
            const href = `/planung/${run.id}`;
            const reached = reachedStage(run);
            const status = runStatus(run);
            return (
              <LinkRow key={run.id} href={href}>
                <DataTableCell>
                  <Link href={href} className="font-medium outline-none hover:underline focus-visible:underline">
                    {run.label}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {formatPeriod(run.periodStartsOn, run.periodEndsOn)} · erstellt {formatDate(run.createdAt)}
                  </div>
                </DataTableCell>
                <DataTableCell className="font-mono text-xs tabular-nums">{schoolYearLabel(run.periodStartsOn)}</DataTableCell>
                <DataTableCell>
                  <div className="flex items-center gap-1.5" aria-label={`Stufe ${reached + 1} von 4`}>
                    {STAGES.map((stage, index) => (
                      <span
                        key={stage}
                        title={STAGE_LABELS[stage]}
                        className={cn(
                          "h-1.5 w-8 rounded-full",
                          index <= reached ? (run.status === "committed" ? "bg-ok" : "bg-accent") : "bg-border",
                        )}
                      />
                    ))}
                  </div>
                </DataTableCell>
                <DataTableCell>
                  <StatusDot tone={status.tone} label={status.label} />
                </DataTableCell>
                <DataTableCell className="text-right">
                  <div className="inline-flex items-center gap-1">
                    <Button asChild variant="outline" size="sm">
                      <Link href={href}>{run.status === "committed" ? "Ansehen" : "Fortsetzen"}</Link>
                    </Button>
                    <DiscardRunButton run={run} />
                  </div>
                </DataTableCell>
              </LinkRow>
            );
          })
        )}
      </TableBody>
    </DataTable>
  );
}
