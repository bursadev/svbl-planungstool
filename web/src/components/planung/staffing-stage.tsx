"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataTable, DataTableCell, DataTableEmpty, DataTableHead } from "@/components/data";
import { ConfirmDialog } from "@/components/form";
import { Button } from "@/components/ui/button";
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api";
import { staffRun, type PlanningRun, type RunCourse } from "@/lib/api/planning-runs";
import { cn } from "@/lib/utils";
import { FixDialog } from "./fix-dialog";

const COLUMNS = 7;

type StaffingStageProps = { run: PlanningRun; courses: RunCourse[]; prevHref: string; nextHref: string };

/** Stage 3 «Ausbilder»: the best candidate per placed course with score and reasons; red rows offer «Lösung finden». */
export function StaffingStage({ run, courses, prevHref, nextHref }: StaffingStageProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [fixing, setFixing] = useState<RunCourse | null>(null);
  const editable = run.status === "draft";
  const placed = courses.filter((c) => c.planningIssue === null);
  const staffed = placed.filter((c) => c.proposedInstructor).length;

  async function restaff() {
    setBusy(true);
    try {
      await staffRun(run.id);
      toast.success("Ausbilder neu zugeteilt");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Besetzung fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  const drawerHref = (course: RunCourse) =>
    `/kurse?von=${run.periodStartsOn}&bis=${run.periodEndsOn}&status=demand&kurs=${course.id}`;

  return (
    <div className="flex flex-col gap-4">
      <p className="max-w-3xl text-[13px] text-muted-foreground">
        Die Engine prüft Skills, Zertifikate an jedem Kurstag, Gerätequalifikation, Sprache und Verfügbarkeit und
        bewertet Nähe, Kontinuität und Qualifikationspflege. Kurse mit den wenigsten Kandidaten werden zuerst besetzt.
      </p>
      <DataTable>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DataTableHead>Modul</DataTableHead>
            <DataTableHead>Inhalt</DataTableHead>
            <DataTableHead>Standort</DataTableHead>
            <DataTableHead>KW</DataTableHead>
            <DataTableHead>Vorschlag</DataTableHead>
            <DataTableHead className="text-right">Score</DataTableHead>
            <DataTableHead>Begründung</DataTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {placed.length === 0 ? (
            <DataTableEmpty colSpan={COLUMNS}>Keine platzierten Kurse.</DataTableEmpty>
          ) : (
            placed.map((course) => {
              const proposal = course.proposedInstructor;
              const bad = !proposal;
              return (
                <TableRow key={course.id} className={cn(bad && "bg-bad-soft hover:bg-bad-soft")}>
                  <DataTableCell className="font-mono text-xs">{course.courseType.code}</DataTableCell>
                  <DataTableCell className="max-w-xs truncate">{course.courseType.name}</DataTableCell>
                  <DataTableCell className="max-w-40 truncate">{course.location.name}</DataTableCell>
                  <DataTableCell className="font-mono text-xs tabular-nums">KW {course.isoWeek}</DataTableCell>
                  <DataTableCell>
                    {proposal ? (
                      <>
                        <Link href={drawerHref(course)} className="font-medium hover:underline">
                          {proposal.firstName} {proposal.lastName}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {proposal.candidateCount === null ? "von Hand gewählt" : `${proposal.candidateCount} machbare Kandidaten`}
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="font-medium text-bad">kein machbarer Ausbilder</span>
                        <div className="text-xs text-bad">harte Regeln verletzt</div>
                      </>
                    )}
                  </DataTableCell>
                  <DataTableCell className="text-right font-mono text-xs tabular-nums">{proposal?.score ?? "–"}</DataTableCell>
                  <DataTableCell className="max-w-sm">
                    <div className="flex items-start gap-2">
                      <span className={cn("min-w-0 text-xs", bad ? "text-bad" : "text-muted-foreground")}>
                        {proposal
                          ? proposal.why || "erfüllt alle harten Regeln"
                          : (course.staffingIssue ?? "Skills, Zertifikate, Sprache oder Verfügbarkeit passen bei keinem Ausbilder")}
                      </span>
                      {bad && editable ? (
                        <Button type="button" size="sm" variant="outline" className="ms-auto shrink-0" onClick={() => setFixing(course)}>
                          Lösung finden
                        </Button>
                      ) : null}
                    </div>
                  </DataTableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </DataTable>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] text-muted-foreground">
          {staffed} von {placed.length} Kursen haben einen machbaren Ausbilder
        </span>
        <div className="ms-auto flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={prevHref} scroll={false}>
              Zurück
            </Link>
          </Button>
          {editable ? (
            <Button type="button" variant="outline" disabled={busy} onClick={() => setConfirmOpen(true)}>
              Neu zuteilen
            </Button>
          ) : null}
          <Button asChild>
            <Link href={nextHref} scroll={false}>
              Weiter: Übernahme prüfen
            </Link>
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Ausbilder neu zuteilen?"
        description="Alle vorgeschlagenen Zuweisungen dieses Laufs werden ersetzt; von Hand gewählte Ausbilder gehen verloren."
        confirmLabel="Neu zuteilen"
        onConfirm={restaff}
      />
      <FixDialog runId={run.id} course={fixing} onClose={() => setFixing(null)} />
    </div>
  );
}
