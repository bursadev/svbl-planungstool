"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { ActiveBadge, DataTable, DataTableCell, DataTableEmpty, DataTableHead } from "@/components/data";
import { ConfirmDialog } from "@/components/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api";
import type { CourseType } from "@/lib/api/course-types";
import { deleteCurriculumModule, type CurriculumModule } from "@/lib/api/curriculum";
import { TRACK_LABELS, type Track } from "@/lib/format";
import { ModuleDialog } from "./module-dialog";
import { SectionHeader } from "./section-header";

const COLUMNS = 7;

type ModulesSectionProps = {
  track: Track;
  modules: CurriculumModule[];
  courseTypes: CourseType[];
};

/** Section «ÜK-Module»: the modules of one Lehrgang with create, edit and delete. */
export function ModulesSection({ track, modules, courseTypes }: ModulesSectionProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CurriculumModule | undefined>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CurriculumModule | undefined>();

  function openCreate() {
    setEditTarget(undefined);
    setDialogOpen(true);
  }

  function openEdit(module: CurriculumModule) {
    setEditTarget(module);
    setDialogOpen(true);
  }

  function openDelete(module: CurriculumModule) {
    setDeleteTarget(module);
    setConfirmOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteCurriculumModule(deleteTarget.id);
      toast.success("Modul gelöscht");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unerwarteter Fehler.");
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader
        title="ÜK-Module"
        count={modules.length}
        actions={
          <Button variant="outline" size="sm" onClick={openCreate}>
            <PlusIcon data-icon="inline-start" />
            Modul anlegen
          </Button>
        }
      />

      <DataTable>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DataTableHead className="text-right">Semester</DataTableHead>
            <DataTableHead className="text-right">Reihenfolge</DataTableHead>
            <DataTableHead>Kurstyp</DataTableHead>
            <DataTableHead className="text-right">Tage</DataTableHead>
            <DataTableHead>Voraussetzungen</DataTableHead>
            <DataTableHead>Status</DataTableHead>
            <DataTableHead className="w-0">
              <span className="sr-only">Aktionen</span>
            </DataTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {modules.length === 0 ? (
            <DataTableEmpty colSpan={COLUMNS}>Noch keine ÜK-Module für {TRACK_LABELS[track]}.</DataTableEmpty>
          ) : (
            modules.map((module) => (
              <TableRow key={module.id}>
                <DataTableCell className="text-right font-mono tabular-nums">{module.semester}</DataTableCell>
                <DataTableCell className="text-right font-mono tabular-nums">{module.sequence}</DataTableCell>
                <DataTableCell>
                  <div className="font-medium">{module.courseType.name}</div>
                  <div className="font-mono text-xs text-muted-foreground">{module.courseType.code}</div>
                </DataTableCell>
                <DataTableCell className="text-right font-mono tabular-nums">
                  {module.courseType.durationDays}
                </DataTableCell>
                <DataTableCell>
                  {module.prerequisites.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {module.prerequisites.map((prerequisite) => (
                        <Badge key={prerequisite.id} variant="outline" className="font-mono" title={prerequisite.name}>
                          {prerequisite.code}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">–</span>
                  )}
                </DataTableCell>
                <DataTableCell>
                  <ActiveBadge active={module.active} />
                </DataTableCell>
                <DataTableCell className="py-1.5 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="xs" onClick={() => openEdit(module)}>
                      Bearbeiten
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-destructive hover:text-destructive"
                      onClick={() => openDelete(module)}
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

      <ModuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        track={track}
        courseTypes={courseTypes}
        modules={modules}
        module={editTarget}
      />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={deleteTarget ? `Modul «${deleteTarget.courseType.code}» löschen?` : "Modul löschen?"}
        description="Das ÜK-Modul wird aus dem Bildungsplan entfernt. Solange Zeitfenster oder andere Module es verwenden, lehnt das System das Löschen ab."
        onConfirm={handleDelete}
      />
    </section>
  );
}
