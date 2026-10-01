"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { ActiveBadge } from "@/components/data/active-badge";
import { DataTable, DataTableCell, DataTableEmpty, DataTableHead } from "@/components/data/data-table";
import { ConfirmDialog } from "@/components/form/confirm-dialog";
import { Button } from "@/components/ui/button";
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import { deleteSchoolClass, type SchoolClass, type VocationalSchool } from "@/lib/api/vocational-schools";
import { TRACK_LABELS } from "@/lib/format";
import { formatClassDays } from "./labels";
import { SchoolClassDialog } from "./school-class-dialog";
import { SchoolDaysDialog } from "./school-days-dialog";

const COLUMNS = 7;

/** Expanded row of a Berufsschule: its classes with Schultage, edit and delete, plus «Klasse anlegen». */
export function SchoolClassesPanel({ school }: { school: VocationalSchool }) {
  const router = useRouter();
  // The dialogs keep their last target while closing, so the title does not flip mid-animation.
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SchoolClass | undefined>();
  const [daysDialogOpen, setDaysDialogOpen] = useState(false);
  const [daysTarget, setDaysTarget] = useState<SchoolClass | undefined>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SchoolClass | undefined>();

  function openCreate() {
    setEditTarget(undefined);
    setClassDialogOpen(true);
  }

  function openEdit(schoolClass: SchoolClass) {
    setEditTarget(schoolClass);
    setClassDialogOpen(true);
  }

  function openDays(schoolClass: SchoolClass) {
    setDaysTarget(schoolClass);
    setDaysDialogOpen(true);
  }

  function openDelete(schoolClass: SchoolClass) {
    setDeleteTarget(schoolClass);
    setConfirmOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteSchoolClass(deleteTarget.id);
      toast.success("Klasse gelöscht");
      router.refresh();
    } catch (error) {
      // 409 while apprentices reference the class: the API message names the reason.
      toast.error(error instanceof ApiError ? error.message : "Unerwarteter Fehler.");
    }
  }

  const classes = school.classes;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {classes.length} {classes.length === 1 ? "Klasse" : "Klassen"}
        </p>
        <Button variant="outline" size="sm" onClick={openCreate}>
          <PlusIcon data-icon="inline-start" />
          Klasse anlegen
        </Button>
      </div>

      <DataTable>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DataTableHead>Klasse</DataTableHead>
            <DataTableHead>Lehrgang</DataTableHead>
            <DataTableHead className="text-right">Startjahr</DataTableHead>
            <DataTableHead>Schultage</DataTableHead>
            <DataTableHead className="text-right">Lernende</DataTableHead>
            <DataTableHead>Status</DataTableHead>
            <DataTableHead className="w-0">
              <span className="sr-only">Aktionen</span>
            </DataTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.length === 0 ? (
            <DataTableEmpty colSpan={COLUMNS}>Noch keine Klassen erfasst.</DataTableEmpty>
          ) : (
            classes.map((schoolClass) => {
              const dayLines = formatClassDays(schoolClass.days);
              return (
                <TableRow key={schoolClass.id}>
                  <DataTableCell className="font-mono font-medium">{schoolClass.code}</DataTableCell>
                  <DataTableCell>{TRACK_LABELS[schoolClass.track]}</DataTableCell>
                  <DataTableCell className="text-right font-mono tabular-nums">{schoolClass.startYear}</DataTableCell>
                  <DataTableCell className="whitespace-normal">
                    {dayLines.length === 0 ? (
                      <span className="text-muted-foreground">keine</span>
                    ) : (
                      dayLines.map((line) => <div key={line}>{line}</div>)
                    )}
                  </DataTableCell>
                  <DataTableCell className="text-right font-mono tabular-nums">
                    {schoolClass.apprenticeCount}
                  </DataTableCell>
                  <DataTableCell>
                    <ActiveBadge active={schoolClass.active} />
                  </DataTableCell>
                  <DataTableCell className="py-1.5 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="xs" onClick={() => openDays(schoolClass)}>
                        Schultage
                      </Button>
                      <Button variant="ghost" size="xs" onClick={() => openEdit(schoolClass)}>
                        Bearbeiten
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-destructive hover:text-destructive"
                        onClick={() => openDelete(schoolClass)}
                      >
                        Löschen
                      </Button>
                    </div>
                  </DataTableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </DataTable>

      <SchoolClassDialog
        open={classDialogOpen}
        onOpenChange={setClassDialogOpen}
        schoolId={school.id}
        schoolClass={editTarget}
      />
      {daysTarget ? (
        <SchoolDaysDialog open={daysDialogOpen} onOpenChange={setDaysDialogOpen} schoolClass={daysTarget} />
      ) : null}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={deleteTarget ? `Klasse «${deleteTarget.code}» löschen?` : "Klasse löschen?"}
        description="Die Klasse und ihre Schultage werden dauerhaft gelöscht. Solange Lernende zugeordnet sind, ist das nicht möglich."
        onConfirm={handleDelete}
      />
    </div>
  );
}
