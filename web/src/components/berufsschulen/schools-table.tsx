"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";
import { toast } from "sonner";
import { ActiveBadge } from "@/components/data/active-badge";
import { DataTable, DataTableCell, DataTableEmpty, DataTableHead } from "@/components/data/data-table";
import { ConfirmDialog } from "@/components/form/confirm-dialog";
import { Button } from "@/components/ui/button";
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import { deleteVocationalSchool, type VocationalSchool } from "@/lib/api/vocational-schools";
import { LANGUAGE_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SchoolClassesPanel } from "./school-classes-panel";
import { SchoolDialog, type LocationOption } from "./school-dialog";

const COLUMNS = 7;

type SchoolsTableProps = {
  schools: VocationalSchool[];
  locations: LocationOption[];
};

/** The `/berufsschulen` list; the chevron expands a row to the school's classes. */
export function SchoolsTable({ schools, locations }: SchoolsTableProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  // The dialogs keep their last target while closing, so the title does not flip mid-animation.
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<VocationalSchool | undefined>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VocationalSchool | undefined>();

  function toggle(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openEdit(school: VocationalSchool) {
    setEditTarget(school);
    setDialogOpen(true);
  }

  function openDelete(school: VocationalSchool) {
    setDeleteTarget(school);
    setConfirmOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteVocationalSchool(deleteTarget.id);
      toast.success("Berufsschule gelöscht");
      router.refresh();
    } catch (error) {
      // 409 while classes or apprentices reference the school: the API message names the reason.
      toast.error(error instanceof ApiError ? error.message : "Unerwarteter Fehler.");
    }
  }

  return (
    <>
      <DataTable>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DataTableHead>Schule</DataTableHead>
            <DataTableHead>Sprache</DataTableHead>
            <DataTableHead>ÜK-Standort</DataTableHead>
            <DataTableHead className="text-right">Klassen</DataTableHead>
            <DataTableHead className="text-right">Lernende</DataTableHead>
            <DataTableHead>Status</DataTableHead>
            <DataTableHead className="w-0">
              <span className="sr-only">Aktionen</span>
            </DataTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schools.length === 0 ? (
            <DataTableEmpty colSpan={COLUMNS}>Noch keine Berufsschulen erfasst.</DataTableEmpty>
          ) : (
            schools.map((school) => {
              const isOpen = expanded.has(school.id);
              const panelId = `school-${school.id}-classes`;
              return (
                <Fragment key={school.id}>
                  <TableRow>
                    <DataTableCell className="max-w-md">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          aria-label={isOpen ? "Klassen ausblenden" : "Klassen anzeigen"}
                          onClick={() => toggle(school.id)}
                        >
                          <ChevronRightIcon className={cn("transition-transform", isOpen && "rotate-90")} />
                        </Button>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{school.name}</div>
                          <div className="truncate text-xs text-muted-foreground">{school.shortName}</div>
                        </div>
                      </div>
                    </DataTableCell>
                    <DataTableCell>{LANGUAGE_LABELS[school.language]}</DataTableCell>
                    <DataTableCell>{school.nearestLocation.name}</DataTableCell>
                    <DataTableCell className="text-right font-mono tabular-nums">{school.classes.length}</DataTableCell>
                    <DataTableCell className="text-right font-mono tabular-nums">{school.apprenticeCount}</DataTableCell>
                    <DataTableCell>
                      <ActiveBadge active={school.active} />
                    </DataTableCell>
                    <DataTableCell className="py-1.5 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="xs" onClick={() => openEdit(school)}>
                          Bearbeiten
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-destructive hover:text-destructive"
                          onClick={() => openDelete(school)}
                        >
                          Löschen
                        </Button>
                      </div>
                    </DataTableCell>
                  </TableRow>
                  {isOpen ? (
                    <TableRow id={panelId} className="bg-muted/30 hover:bg-muted/30">
                      <DataTableCell colSpan={COLUMNS} className="px-4 py-3 whitespace-normal">
                        <SchoolClassesPanel school={school} />
                      </DataTableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              );
            })
          )}
        </TableBody>
      </DataTable>

      <SchoolDialog open={dialogOpen} onOpenChange={setDialogOpen} locations={locations} school={editTarget} />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={deleteTarget ? `«${deleteTarget.name}» löschen?` : "Berufsschule löschen?"}
        description="Die Berufsschule wird dauerhaft gelöscht. Solange Klassen oder Lernende zugeordnet sind, ist das nicht möglich."
        onConfirm={handleDelete}
      />
    </>
  );
}
