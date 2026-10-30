"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import {
  ActiveBadge,
  BulkBar,
  DataTable,
  DataTableCell,
  DataTableEmpty,
  DataTableHead,
  SelectAllHead,
  SelectCell,
  SelectionProvider,
} from "@/components/data";
import { ConfirmDialog } from "@/components/form/confirm-dialog";
import { Button } from "@/components/ui/button";
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import { SKILLS_PATH, deleteSkill, type Skill } from "@/lib/api/skills";
import { CatalogToolbar } from "./catalog-toolbar";
import { SkillDialog } from "./skill-dialog";

const COLUMNS = 6;

type SkillsPanelProps = {
  skills: Skill[];
  /** API filters of the view, for the filtered CSV export. */
  filters: Record<string, string | undefined>;
  filtered: boolean;
};

/**
 * Tab «Skills»: toolbar with search, archive filter and CSV, a selectable table for bulk
 * archive / restore / delete, and per-row edit and delete.
 */
export function SkillsPanel({ skills, filters, filtered }: SkillsPanelProps) {
  const router = useRouter();
  // The dialogs keep their last target while closing, so the title does not flip mid-animation.
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Skill | undefined>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Skill | undefined>();

  function openCreate() {
    setEditTarget(undefined);
    setDialogOpen(true);
  }

  function openEdit(skill: Skill) {
    setEditTarget(skill);
    setDialogOpen(true);
  }

  function openDelete(skill: Skill) {
    setDeleteTarget(skill);
    setConfirmOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteSkill(deleteTarget.id);
      toast.success("Skill gelöscht");
      router.refresh();
    } catch (error) {
      // 409 while the Skill is referenced by Ausbilder, Kurstypen or Gerätetypen: the API names the reason.
      toast.error(error instanceof ApiError ? error.message : "Unerwarteter Fehler.");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <CatalogToolbar
        basePath={SKILLS_PATH}
        plural="Skills"
        searchPlaceholder="Name, Kategorie, Beschreibung"
        filters={filters}
        filtered={filtered}
      >
        <Button onClick={openCreate}>
          <PlusIcon data-icon="inline-start" />
          Skill anlegen
        </Button>
      </CatalogToolbar>

      <SelectionProvider ids={skills.map((skill) => skill.id)}>
        <BulkBar basePath={SKILLS_PATH} plural="Skills" />
        <DataTable>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <SelectAllHead />
              <DataTableHead>Name</DataTableHead>
              <DataTableHead>Kategorie</DataTableHead>
              <DataTableHead>Beschreibung</DataTableHead>
              <DataTableHead>Status</DataTableHead>
              <DataTableHead className="w-0">
                <span className="sr-only">Aktionen</span>
              </DataTableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {skills.length === 0 ? (
              <DataTableEmpty colSpan={COLUMNS}>
                {filtered ? "Keine Skills gefunden." : "Noch keine Skills erfasst."}
              </DataTableEmpty>
            ) : (
              skills.map((skill) => (
                <TableRow key={skill.id}>
                  <SelectCell id={skill.id} label={skill.name} />
                  <DataTableCell className="font-medium">{skill.name}</DataTableCell>
                  <DataTableCell>{skill.category ?? <span className="text-muted-foreground">–</span>}</DataTableCell>
                  <DataTableCell className="max-w-md">
                    {skill.description ? (
                      <span className="line-clamp-2 whitespace-normal text-muted-foreground">{skill.description}</span>
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </DataTableCell>
                  <DataTableCell>
                    <ActiveBadge active={skill.active} />
                  </DataTableCell>
                  <DataTableCell className="py-1.5 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="xs" onClick={() => openEdit(skill)}>
                        Bearbeiten
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-destructive hover:text-destructive"
                        onClick={() => openDelete(skill)}
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
      </SelectionProvider>

      <SkillDialog open={dialogOpen} onOpenChange={setDialogOpen} skill={editTarget} />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={deleteTarget ? `Skill «${deleteTarget.name}» löschen?` : "Skill löschen?"}
        description="Der Skill wird dauerhaft gelöscht. Solange er Ausbildern, Kurstypen oder Gerätetypen zugewiesen ist, wird das Löschen abgelehnt."
        onConfirm={handleDelete}
      />
    </div>
  );
}
