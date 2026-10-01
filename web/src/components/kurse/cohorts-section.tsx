"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { DataTable, DataTableCell, DataTableEmpty, DataTableHead } from "@/components/data";
import { ConfirmDialog } from "@/components/form";
import { Button } from "@/components/ui/button";
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api";
import { deleteCohort, type Cohort } from "@/lib/api/curriculum";
import type { Track } from "@/lib/format";
import { CohortDialog } from "./cohort-dialog";
import { TrackBadge } from "./course-badges";
import { SectionHeader } from "./section-header";

const COLUMNS = 5;

type CohortsSectionProps = {
  /** All Jahrgänge, newest first; the Lehrgang column tells them apart. */
  cohorts: Cohort[];
  /** Preselected Lehrgang for «Jahrgang anlegen». */
  track: Track;
};

/** Section «Jahrgänge» with create, edit and delete. */
export function CohortsSection({ cohorts, track }: CohortsSectionProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Cohort | undefined>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Cohort | undefined>();

  function openCreate() {
    setEditTarget(undefined);
    setDialogOpen(true);
  }

  function openEdit(cohort: Cohort) {
    setEditTarget(cohort);
    setDialogOpen(true);
  }

  function openDelete(cohort: Cohort) {
    setDeleteTarget(cohort);
    setConfirmOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteCohort(deleteTarget.id);
      toast.success("Jahrgang gelöscht");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unerwarteter Fehler.");
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader
        title="Jahrgänge"
        count={cohorts.length}
        actions={
          <Button variant="outline" size="sm" onClick={openCreate}>
            <PlusIcon data-icon="inline-start" />
            Jahrgang anlegen
          </Button>
        }
      />

      <DataTable>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DataTableHead>Jahrgang</DataTableHead>
            <DataTableHead>Lehrgang</DataTableHead>
            <DataTableHead className="text-right">Startjahr</DataTableHead>
            <DataTableHead className="text-right">Voraussichtliches Ende</DataTableHead>
            <DataTableHead className="w-0">
              <span className="sr-only">Aktionen</span>
            </DataTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cohorts.length === 0 ? (
            <DataTableEmpty colSpan={COLUMNS}>Noch keine Jahrgänge erfasst.</DataTableEmpty>
          ) : (
            cohorts.map((cohort) => (
              <TableRow key={cohort.id}>
                <DataTableCell className="font-medium">{cohort.label}</DataTableCell>
                <DataTableCell>
                  <TrackBadge track={cohort.track} />
                </DataTableCell>
                <DataTableCell className="text-right font-mono tabular-nums">{cohort.startYear}</DataTableCell>
                <DataTableCell className="text-right font-mono tabular-nums">
                  {cohort.expectedEndYear ?? <span className="text-muted-foreground">–</span>}
                </DataTableCell>
                <DataTableCell className="py-1.5 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="xs" onClick={() => openEdit(cohort)}>
                      Bearbeiten
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-destructive hover:text-destructive"
                      onClick={() => openDelete(cohort)}
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

      <CohortDialog open={dialogOpen} onOpenChange={setDialogOpen} defaultTrack={track} cohort={editTarget} />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={deleteTarget ? `Jahrgang «${deleteTarget.label}» löschen?` : "Jahrgang löschen?"}
        description="Der Jahrgang wird dauerhaft gelöscht. Solange Zeitfenster oder Lernende ihm zugeordnet sind, lehnt das System das Löschen ab."
        onConfirm={handleDelete}
      />
    </section>
  );
}
