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
import { proposeCourses, staffRun, type PlanningRun, type RunCourse } from "@/lib/api/planning-runs";
import { cn } from "@/lib/utils";
import { FixDialog } from "./fix-dialog";
import { formatCourseDates } from "./format";

const COLUMNS = 8;

type CoursesStageProps = { run: PlanningRun; courses: RunCourse[]; prevHref: string; nextHref: string };

/** Stage 2 «Kurse & Termine»: one row per proposed course; critical rows offer «Lösung finden». */
export function CoursesStage({ run, courses, prevHref, nextHref }: CoursesStageProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<"propose" | "staff" | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [fixing, setFixing] = useState<RunCourse | null>(null);
  const editable = run.status === "draft";
  const placed = courses.filter((c) => c.planningIssue === null).length;

  async function propose() {
    setBusy("propose");
    try {
      await proposeCourses(run.id);
      toast.success("Kurse neu vorgeschlagen");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Kurse konnten nicht vorgeschlagen werden.");
    } finally {
      setBusy(null);
    }
  }

  async function next() {
    setBusy("staff");
    try {
      const result = await staffRun(run.id);
      toast.success(`${result.filter((c) => c.proposedInstructor).length} Kurse besetzt`);
      router.replace(nextHref, { scroll: false });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Besetzung fehlgeschlagen.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="max-w-3xl text-[13px] text-muted-foreground">
        Vorschlag pro Kurs: Woche im Zeitfenster, Raum am Standort, Wochentage ohne den Schultag der Gruppe. Kapazität
        je Standort, Raumbelegung und Geräte sind berücksichtigt; schwierigste Kurse zuerst, dann Reparatur.
      </p>
      <DataTable>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DataTableHead>Modul</DataTableHead>
            <DataTableHead>Inhalt</DataTableHead>
            <DataTableHead>Standort</DataTableHead>
            <DataTableHead>KW</DataTableHead>
            <DataTableHead>Tage</DataTableHead>
            <DataTableHead>Raum</DataTableHead>
            <DataTableHead className="text-right">Plätze</DataTableHead>
            <DataTableHead>Hinweis</DataTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.length === 0 ? (
            <DataTableEmpty colSpan={COLUMNS}>Noch keine Kurse vorgeschlagen.</DataTableEmpty>
          ) : (
            courses.map((course) => {
              const bad = course.planningIssue !== null;
              return (
                <TableRow key={course.id} className={cn(bad && "bg-bad-soft hover:bg-bad-soft")}>
                  <DataTableCell className="font-mono text-xs">{course.courseType.code}</DataTableCell>
                  <DataTableCell className="max-w-xs">
                    <div className="truncate">{course.courseType.name}</div>
                    <div className="text-xs text-muted-foreground">{course.cohort?.label}</div>
                  </DataTableCell>
                  <DataTableCell className="max-w-40 truncate">{course.location.name}</DataTableCell>
                  <DataTableCell className="font-mono text-xs tabular-nums">
                    {course.isoWeek === null ? "–" : `KW ${course.isoWeek}`}
                  </DataTableCell>
                  <DataTableCell className="whitespace-nowrap">{formatCourseDates(course.dates)}</DataTableCell>
                  <DataTableCell>{course.room?.name ?? "–"}</DataTableCell>
                  <DataTableCell className="text-right font-mono text-xs tabular-nums">
                    {course.booked}/{course.seats}
                  </DataTableCell>
                  <DataTableCell className="max-w-sm">
                    <div className="flex items-start gap-2">
                      <span className={cn("min-w-0 text-xs", bad ? "text-bad" : "text-muted-foreground")}>
                        {course.planningIssue ?? course.reasons.join(" · ")}
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
          {placed} von {courses.length} Kursen planbar · {courses.length - placed} brauchen eine Entscheidung
        </span>
        <div className="ms-auto flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={prevHref} scroll={false}>
              Zurück
            </Link>
          </Button>
          {editable ? (
            <>
              <Button type="button" variant="outline" disabled={busy !== null} onClick={() => setConfirmOpen(true)}>
                Neu vorschlagen
              </Button>
              <Button type="button" disabled={busy !== null || placed === 0} onClick={next}>
                {busy === "staff" ? "Ausbilder werden zugeteilt …" : "Weiter: Ausbilder zuteilen"}
              </Button>
            </>
          ) : (
            <Button asChild>
              <Link href={nextHref} scroll={false}>
                Weiter: Ausbilder
              </Link>
            </Button>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Kurse neu vorschlagen?"
        description="Die vorgeschlagenen Kurse, Anmeldungen und Ausbilder dieses Laufs werden verworfen und neu berechnet; von Hand übernommene Lösungen gehen verloren."
        confirmLabel="Neu vorschlagen"
        onConfirm={propose}
      />
      <FixDialog runId={run.id} course={fixing} onClose={() => setFixing(null)} />
    </div>
  );
}
