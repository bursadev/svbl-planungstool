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
import { deleteTrainer, type Trainer } from "@/lib/api/training-companies";
import { TrainerDialog } from "./trainer-dialog";

const COLUMNS = 4;

/** Tab «Berufsbildner»: table with per-row edit and delete, plus «Berufsbildner hinzufügen». */
export function TrainersPanel({ companyId, trainers }: { companyId: string; trainers: Trainer[] }) {
  const router = useRouter();
  // The dialogs keep their last target while closing, so the title does not flip mid-animation.
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Trainer | undefined>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Trainer | undefined>();

  function openCreate() {
    setEditTarget(undefined);
    setDialogOpen(true);
  }

  function openEdit(trainer: Trainer) {
    setEditTarget(trainer);
    setDialogOpen(true);
  }

  function openDelete(trainer: Trainer) {
    setDeleteTarget(trainer);
    setConfirmOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteTrainer(deleteTarget.id);
      toast.success("Berufsbildner gelöscht");
      router.refresh();
    } catch (error) {
      // 409 while Lernende still reference the Berufsbildner.
      toast.error(error instanceof ApiError ? error.message : "Unerwarteter Fehler.");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{trainers.length} Berufsbildner</p>
        <Button variant="outline" size="sm" onClick={openCreate}>
          <PlusIcon data-icon="inline-start" />
          Berufsbildner hinzufügen
        </Button>
      </div>

      <DataTable>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DataTableHead>Name</DataTableHead>
            <DataTableHead>Kontakt</DataTableHead>
            <DataTableHead className="text-right">Lernende</DataTableHead>
            <DataTableHead className="w-0">
              <span className="sr-only">Aktionen</span>
            </DataTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trainers.length === 0 ? (
            <DataTableEmpty colSpan={COLUMNS}>Noch keine Berufsbildner erfasst.</DataTableEmpty>
          ) : (
            trainers.map((trainer) => (
              <TableRow key={trainer.id}>
                <DataTableCell className="font-medium">
                  {trainer.firstName} {trainer.lastName}
                </DataTableCell>
                <DataTableCell className="max-w-xs">
                  {trainer.email || trainer.phone ? (
                    <>
                      {trainer.email ? <div className="truncate">{trainer.email}</div> : null}
                      {trainer.phone ? (
                        <div className="truncate text-xs text-muted-foreground">{trainer.phone}</div>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-muted-foreground">–</span>
                  )}
                </DataTableCell>
                <DataTableCell className="text-right font-mono tabular-nums">{trainer.apprenticeCount}</DataTableCell>
                <DataTableCell className="py-1.5 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="xs" onClick={() => openEdit(trainer)}>
                      Bearbeiten
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-destructive hover:text-destructive"
                      onClick={() => openDelete(trainer)}
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

      <TrainerDialog open={dialogOpen} onOpenChange={setDialogOpen} companyId={companyId} trainer={editTarget} />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={
          deleteTarget
            ? `«${deleteTarget.firstName} ${deleteTarget.lastName}» löschen?`
            : "Berufsbildner löschen?"
        }
        description="Der Berufsbildner wird dauerhaft gelöscht."
        onConfirm={handleDelete}
      />
    </div>
  );
}
