"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { DataTable, DataTableCell, DataTableEmpty, DataTableHead, EmptyState } from "@/components/data";
import { ConfirmDialog } from "@/components/form";
import { Button } from "@/components/ui/button";
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api";
import { deleteTimeWindow, type Cohort, type CurriculumModule, type TimeWindow } from "@/lib/api/curriculum";
import type { Location } from "@/lib/api/locations";
import { formatDate, TRACK_LABELS, type Track } from "@/lib/format";
import { SectionHeader } from "@/components/data/section-header";
import { TimeWindowDialog } from "./time-window-dialog";
import { UrlSelect } from "@/components/data/url-select";

const COLUMNS = 7;

type TimeWindowsSectionProps = {
  track: Track;
  /** Jahrgänge of this Lehrgang, newest first; the first is the default selection. */
  cohorts: Cohort[];
  /** The selected Jahrgang, `null` when the Lehrgang has none yet. */
  cohort: Cohort | null;
  modules: CurriculumModule[];
  locations: Location[];
  timeWindows: TimeWindow[];
};

/** Section «Zeitfenster»: the windows of one Jahrgang (`?jahrgang=`), with create, edit and delete. */
export function TimeWindowsSection({ track, cohorts, cohort, modules, locations, timeWindows }: TimeWindowsSectionProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TimeWindow | undefined>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TimeWindow | undefined>();

  function openCreate() {
    setEditTarget(undefined);
    setDialogOpen(true);
  }

  function openEdit(timeWindow: TimeWindow) {
    setEditTarget(timeWindow);
    setDialogOpen(true);
  }

  function openDelete(timeWindow: TimeWindow) {
    setDeleteTarget(timeWindow);
    setConfirmOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteTimeWindow(deleteTarget.id);
      toast.success("Zeitfenster gelöscht");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unerwarteter Fehler.");
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader
        title="Zeitfenster"
        count={cohort ? timeWindows.length : undefined}
        actions={
          cohort ? (
            <>
              <UrlSelect
                param="jahrgang"
                label="Jahrgang"
                options={cohorts.map((candidate) => ({ value: candidate.id, label: candidate.label }))}
                defaultValue={cohorts[0]?.id}
                className="w-44"
              />
              <Button variant="outline" size="sm" onClick={openCreate} disabled={modules.length === 0}>
                <PlusIcon data-icon="inline-start" />
                Zeitfenster anlegen
              </Button>
            </>
          ) : null
        }
      />

      {cohort === null ? (
        <div className="rounded-xl bg-card ring-1 ring-foreground/10">
          <EmptyState>
            Noch kein Jahrgang für {TRACK_LABELS[track]}. Legen Sie zuerst einen Jahrgang an, dann lassen sich seine
            Zeitfenster erfassen.
          </EmptyState>
        </div>
      ) : (
        <DataTable>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <DataTableHead>Modul</DataTableHead>
              <DataTableHead className="text-right">Semester</DataTableHead>
              <DataTableHead>Von</DataTableHead>
              <DataTableHead>Bis</DataTableHead>
              <DataTableHead>Standort</DataTableHead>
              <DataTableHead>Notiz</DataTableHead>
              <DataTableHead className="w-0">
                <span className="sr-only">Aktionen</span>
              </DataTableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {timeWindows.length === 0 ? (
              <DataTableEmpty colSpan={COLUMNS}>
                {modules.length === 0
                  ? `Noch keine ÜK-Module für ${TRACK_LABELS[track]}; Zeitfenster brauchen ein Modul.`
                  : `Noch keine Zeitfenster für «${cohort.label}».`}
              </DataTableEmpty>
            ) : (
              timeWindows.map((timeWindow) => (
                <TableRow key={timeWindow.id}>
                  <DataTableCell>
                    <div className="font-medium">{timeWindow.curriculumModule.courseType.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {timeWindow.curriculumModule.courseType.code}
                    </div>
                  </DataTableCell>
                  <DataTableCell className="text-right font-mono tabular-nums">
                    {timeWindow.curriculumModule.semester}
                  </DataTableCell>
                  <DataTableCell className="font-mono tabular-nums">{formatDate(timeWindow.startsOn)}</DataTableCell>
                  <DataTableCell className="font-mono tabular-nums">{formatDate(timeWindow.endsOn)}</DataTableCell>
                  <DataTableCell>
                    {timeWindow.location ? (
                      timeWindow.location.name
                    ) : (
                      <span className="text-muted-foreground">alle</span>
                    )}
                  </DataTableCell>
                  <DataTableCell className="max-w-xs truncate text-muted-foreground">
                    {timeWindow.note ?? "–"}
                  </DataTableCell>
                  <DataTableCell className="py-1.5 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="xs" onClick={() => openEdit(timeWindow)}>
                        Bearbeiten
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-destructive hover:text-destructive"
                        onClick={() => openDelete(timeWindow)}
                      >
                        Löschen
                      </Button>
                    </div>
                  </DataTableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </DataTable>
      )}

      {cohort ? (
        <TimeWindowDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          cohort={cohort}
          modules={modules}
          locations={locations}
          timeWindow={editTarget}
        />
      ) : null}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={
          deleteTarget
            ? `Zeitfenster «${deleteTarget.curriculumModule.courseType.code}» ${formatDate(deleteTarget.startsOn)} – ${formatDate(deleteTarget.endsOn)} löschen?`
            : "Zeitfenster löschen?"
        }
        description="Das Zeitfenster wird dauerhaft gelöscht."
        onConfirm={handleDelete}
      />
    </section>
  );
}
