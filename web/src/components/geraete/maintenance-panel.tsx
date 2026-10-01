"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WrenchIcon } from "lucide-react";
import { toast } from "sonner";
import { DataTable, DataTableCell, DataTableEmpty, DataTableHead } from "@/components/data/data-table";
import { ConfirmDialog } from "@/components/form/confirm-dialog";
import { Button } from "@/components/ui/button";
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import { deleteMaintenanceWindow, type DeviceDetail, type MaintenanceWindow } from "@/lib/api/devices";
import { formatDate } from "@/lib/format";
import { MaintenanceDialog } from "./maintenance-dialog";

const COLUMNS = 4;

/** Section «Wartungsfenster»: newest first, each editable and deletable; «Wartung erfassen». */
export function MaintenancePanel({ device }: { device: DeviceDetail }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MaintenanceWindow | undefined>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MaintenanceWindow | undefined>();

  function openCreate() {
    setEditTarget(undefined);
    setDialogOpen(true);
  }

  function openEdit(window: MaintenanceWindow) {
    setEditTarget(window);
    setDialogOpen(true);
  }

  function openDelete(window: MaintenanceWindow) {
    setDeleteTarget(window);
    setConfirmOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMaintenanceWindow(deleteTarget.id);
      toast.success("Wartungsfenster gelöscht");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unerwarteter Fehler.");
    }
  }

  const windows = device.maintenanceWindows;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-semibold">Wartungsfenster</h2>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">{windows.length}</span>
        </div>
        <Button variant="outline" size="sm" onClick={openCreate}>
          <WrenchIcon data-icon="inline-start" />
          Wartung erfassen
        </Button>
      </div>

      <DataTable>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DataTableHead>Von</DataTableHead>
            <DataTableHead>Bis</DataTableHead>
            <DataTableHead>Notiz</DataTableHead>
            <DataTableHead className="w-0">
              <span className="sr-only">Aktionen</span>
            </DataTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {windows.length === 0 ? (
            <DataTableEmpty colSpan={COLUMNS}>Noch keine Wartungsfenster erfasst.</DataTableEmpty>
          ) : (
            windows.map((window) => (
              <TableRow key={window.id}>
                <DataTableCell className="font-mono tabular-nums">{formatDate(window.startsOn)}</DataTableCell>
                <DataTableCell className="font-mono tabular-nums">{formatDate(window.endsOn)}</DataTableCell>
                <DataTableCell className="max-w-md">
                  {window.note ? (
                    <span className="line-clamp-2 whitespace-normal text-muted-foreground">{window.note}</span>
                  ) : (
                    <span className="text-muted-foreground">–</span>
                  )}
                </DataTableCell>
                <DataTableCell className="py-1.5 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="xs" onClick={() => openEdit(window)}>
                      Bearbeiten
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-destructive hover:text-destructive"
                      onClick={() => openDelete(window)}
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

      <MaintenanceDialog open={dialogOpen} onOpenChange={setDialogOpen} deviceId={device.id} window={editTarget} />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={
          deleteTarget
            ? `Wartungsfenster ${formatDate(deleteTarget.startsOn)} – ${formatDate(deleteTarget.endsOn)} löschen?`
            : "Wartungsfenster löschen?"
        }
        description="Das Wartungsfenster wird dauerhaft gelöscht; das Gerät gilt in diesem Zeitraum wieder als verfügbar."
        onConfirm={handleDelete}
      />
    </section>
  );
}
