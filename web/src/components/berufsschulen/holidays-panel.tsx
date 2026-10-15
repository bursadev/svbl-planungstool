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
import { deleteSchoolHoliday, type SchoolHoliday } from "@/lib/api/vocational-schools";
import { formatDate } from "@/lib/format";
import { HolidayDialog } from "./holiday-dialog";

const COLUMNS = 4;

/** Whole days from start to end, both inclusive. */
function durationDays(holiday: SchoolHoliday): number {
  const ms = Date.parse(holiday.endsOn) - Date.parse(holiday.startsOn);
  return Math.round(ms / 86_400_000) + 1;
}

/** Tab «Ferien»: holiday periods of the school; no school days fall inside them. */
export function HolidaysPanel({ schoolId, holidays }: { schoolId: string; holidays: SchoolHoliday[] }) {
  const router = useRouter();
  // The dialogs keep their last target while closing, so the title does not flip mid-animation.
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SchoolHoliday | undefined>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SchoolHoliday | undefined>();

  function openCreate() {
    setEditTarget(undefined);
    setDialogOpen(true);
  }

  function openEdit(holiday: SchoolHoliday) {
    setEditTarget(holiday);
    setDialogOpen(true);
  }

  function openDelete(holiday: SchoolHoliday) {
    setDeleteTarget(holiday);
    setConfirmOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteSchoolHoliday(deleteTarget.id);
      toast.success("Ferien gelöscht");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unerwarteter Fehler.");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {holidays.length} {holidays.length === 1 ? "Ferienperiode" : "Ferienperioden"}
        </p>
        <Button variant="outline" size="sm" onClick={openCreate}>
          <PlusIcon data-icon="inline-start" />
          Ferien hinzufügen
        </Button>
      </div>

      <DataTable>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DataTableHead>Bezeichnung</DataTableHead>
            <DataTableHead>Zeitraum</DataTableHead>
            <DataTableHead className="text-right">Tage</DataTableHead>
            <DataTableHead className="w-0">
              <span className="sr-only">Aktionen</span>
            </DataTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {holidays.length === 0 ? (
            <DataTableEmpty colSpan={COLUMNS}>Noch keine Ferien erfasst.</DataTableEmpty>
          ) : (
            holidays.map((holiday) => (
              <TableRow key={holiday.id}>
                <DataTableCell className="font-medium">
                  {holiday.name ?? <span className="text-muted-foreground">–</span>}
                </DataTableCell>
                <DataTableCell className="font-mono tabular-nums">
                  {formatDate(holiday.startsOn)} – {formatDate(holiday.endsOn)}
                </DataTableCell>
                <DataTableCell className="text-right font-mono tabular-nums">{durationDays(holiday)}</DataTableCell>
                <DataTableCell className="py-1.5 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="xs" onClick={() => openEdit(holiday)}>
                      Bearbeiten
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-destructive hover:text-destructive"
                      onClick={() => openDelete(holiday)}
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

      <HolidayDialog open={dialogOpen} onOpenChange={setDialogOpen} schoolId={schoolId} holiday={editTarget} />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Ferien löschen?"
        description={
          deleteTarget
            ? `Die Ferien ${formatDate(deleteTarget.startsOn)} – ${formatDate(deleteTarget.endsOn)} werden dauerhaft gelöscht.`
            : "Die Ferien werden dauerhaft gelöscht."
        }
        onConfirm={handleDelete}
      />
    </div>
  );
}
