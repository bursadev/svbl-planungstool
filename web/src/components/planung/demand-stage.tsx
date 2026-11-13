"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataTable, DataTableCell, DataTableEmpty, DataTableHead } from "@/components/data";
import { ConfirmDialog } from "@/components/form";
import { Button } from "@/components/ui/button";
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api";
import { generateDemand, proposeCourses, type DemandRow, type PlanningRun } from "@/lib/api/planning-runs";
import { LANGUAGE_SHORT_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { formatPeriod, schoolDaysLabel } from "./labels";
import { StageKpis } from "./stage-kpis";

const COLUMNS = 7;

type DemandStageProps = {
  run: PlanningRun;
  demand: DemandRow[];
  /** Whether draft courses exist (a new demand drops them). */
  hasCourses: boolean;
  nextHref: string;
};

/** Stage 1 «Bedarf»: generate, KPIs, the groups table and the step to the course proposal. */
export function DemandStage({ run, demand, hasCourses, nextHref }: DemandStageProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<"demand" | "courses" | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const editable = run.status === "draft";

  async function generate() {
    setBusy("demand");
    try {
      const rows = await generateDemand(run.id);
      toast.success(`${rows.reduce((n, d) => n + d.coursesNeeded, 0)} Kurse nötig für ${run.label}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Bedarf konnte nicht erzeugt werden.");
    } finally {
      setBusy(null);
    }
  }

  async function next() {
    setBusy("courses");
    try {
      const courses = await proposeCourses(run.id);
      const placed = courses.filter((c) => c.planningIssue === null).length;
      toast.success(`${placed} von ${courses.length} Kursen platziert`);
      router.replace(nextHref, { scroll: false });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Kurse konnten nicht vorgeschlagen werden.");
    } finally {
      setBusy(null);
    }
  }

  const summary = run.demandSummary;
  const kpis = demand.length
    ? [
        { label: "Lernende", value: run.counts.apprentices },
        { label: "Module", value: new Set(demand.map((d) => d.module.id)).size },
        { label: "Kurse nötig", value: demand.reduce((n, d) => n + d.coursesNeeded, 0) },
        { label: "Kurstage", value: demand.reduce((n, d) => n + d.coursesNeeded * d.module.durationDays, 0) },
        {
          label: "Nachholer",
          value: summary?.catchUps ?? 0,
          tone: summary?.catchUps ? ("warn" as const) : ("default" as const),
          hint: "nicht eingeplant (Entscheid 4)",
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="max-w-3xl text-[13px] text-muted-foreground">
          Lernende je Jahrgang, Modul und Schultag-Gruppe. Der Standort ergibt sich aus der nächsten Berufsschule, die
          Kurszahl aus der maximalen Teilnehmerzahl; freie Plätze bestehender Kurse werden angerechnet.
        </p>
        {editable ? (
          <Button
            type="button"
            className="ms-auto"
            disabled={busy !== null}
            onClick={() => (hasCourses ? setConfirmOpen(true) : generate())}
          >
            {demand.length ? "Bedarf neu erzeugen" : `Bedarf für ${run.label} erzeugen`}
          </Button>
        ) : null}
      </div>

      {summary?.skippedVariantModules.length || summary?.apprenticesWithoutClass ? (
        <div className="rounded-lg bg-warn-soft px-3 py-2 text-[13px]">
          {summary.skippedVariantModules.length ? (
            <div>
              Nicht geplant (Zuordnung Schule → Variante fehlt): {summary.skippedVariantModules.join(", ")}
            </div>
          ) : null}
          {summary.apprenticesWithoutClass ? (
            <div>{summary.apprenticesWithoutClass} Lernende ohne Klasse – ihre ÜK-Tage können auf Schultage fallen.</div>
          ) : null}
        </div>
      ) : null}

      {demand.length ? (
        <>
          <StageKpis kpis={kpis} />
          <DataTable>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <DataTableHead>Jahrgang</DataTableHead>
                <DataTableHead>Modul</DataTableHead>
                <DataTableHead>Inhalt</DataTableHead>
                <DataTableHead>Standort</DataTableHead>
                <DataTableHead>Schultag</DataTableHead>
                <DataTableHead className="text-right">Lernende</DataTableHead>
                <DataTableHead className="text-right">Kurse</DataTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demand.map((row) => (
                <TableRow key={row.id}>
                  <DataTableCell className="font-mono text-xs">{row.cohort.label}</DataTableCell>
                  <DataTableCell className="font-mono text-xs">{row.module.code}</DataTableCell>
                  <DataTableCell className="max-w-xs">
                    <div className="truncate">{row.module.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.module.semester}. Semester · {formatPeriod(row.window.startsOn, row.window.endsOn)}
                      {row.window.fromTimeWindow ? "" : " (Periode)"} · {row.module.durationDays}{" "}
                      {row.module.durationDays === 1 ? "Tag" : "Tage"} · {LANGUAGE_SHORT_LABELS[row.language]}
                    </div>
                  </DataTableCell>
                  <DataTableCell className="max-w-40 truncate">{row.location.name}</DataTableCell>
                  <DataTableCell>
                    <span
                      className={cn(
                        "inline-block rounded bg-muted px-1.5 py-0.5 text-xs",
                        row.blockedWeekdays.length === 0 && "text-warn",
                      )}
                    >
                      {schoolDaysLabel(row.blockedWeekdays)}
                    </span>
                    <div className="text-xs text-muted-foreground">ÜK an anderen Tagen</div>
                  </DataTableCell>
                  <DataTableCell className="text-right font-mono text-xs tabular-nums">
                    {row.participantCount}
                    {row.existingFreeSeats ? (
                      <div className="text-muted-foreground" title="Freie Plätze bestehender Kurse angerechnet">
                        +{row.existingFreeSeats} bestehend
                      </div>
                    ) : null}
                  </DataTableCell>
                  <DataTableCell className="text-right font-mono text-xs tabular-nums">{row.coursesNeeded}</DataTableCell>
                </TableRow>
              ))}
              {demand.length === 0 ? <DataTableEmpty colSpan={COLUMNS}>Kein Bedarf.</DataTableEmpty> : null}
            </TableBody>
          </DataTable>
          {editable ? (
            <div className="flex justify-end">
              <Button type="button" disabled={busy !== null} onClick={next}>
                {busy === "courses" ? "Kurse werden platziert …" : "Weiter: Kurse und Termine vorschlagen"}
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-[13px] text-muted-foreground">
          Noch kein Bedarf für {run.label} erzeugt.
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Bedarf neu erzeugen?"
        description="Die vorgeschlagenen Kurse, Anmeldungen und Ausbilder dieses Laufs werden verworfen und aus dem neuen Bedarf neu berechnet."
        confirmLabel="Neu erzeugen"
        onConfirm={generate}
      />
    </div>
  );
}
