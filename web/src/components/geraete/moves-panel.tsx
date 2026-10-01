"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, TruckIcon } from "lucide-react";
import { toast } from "sonner";
import { DataTable, DataTableCell, DataTableEmpty, DataTableHead } from "@/components/data/data-table";
import { ConfirmDialog } from "@/components/form/confirm-dialog";
import { Button } from "@/components/ui/button";
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import { deleteDeviceMove, type DeviceDetail, type DeviceMove } from "@/lib/api/devices";
import { formatDate } from "@/lib/format";
import type { PickerOption } from "./labels";
import { MoveDialog } from "./move-dialog";

const COLUMNS = 4;

type MovesPanelProps = {
  device: DeviceDetail;
  locations: PickerOption[];
};

/** Section «Verschiebungen»: newest first, each deletable; «Verschieben» for mobile and rental devices. */
export function MovesPanel({ device, locations }: MovesPanelProps) {
  const router = useRouter();
  const [moveOpen, setMoveOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeviceMove | undefined>();

  function openDelete(move: DeviceMove) {
    setDeleteTarget(move);
    setConfirmOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteDeviceMove(deleteTarget.id);
      toast.success("Verschiebung gelöscht");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unerwarteter Fehler.");
    }
  }

  const fixed = device.mobility === "fixed";

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-semibold">Verschiebungen</h2>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">{device.moves.length}</span>
        </div>
        {fixed ? (
          <p className="text-xs text-muted-foreground">Fest installiert – keine Verschiebungen.</p>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setMoveOpen(true)}>
            <TruckIcon data-icon="inline-start" />
            Verschieben
          </Button>
        )}
      </div>

      <DataTable>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DataTableHead>Gültig ab</DataTableHead>
            <DataTableHead>Von / Nach</DataTableHead>
            <DataTableHead>Notiz</DataTableHead>
            <DataTableHead className="w-0">
              <span className="sr-only">Aktionen</span>
            </DataTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {device.moves.length === 0 ? (
            <DataTableEmpty colSpan={COLUMNS}>Noch keine Verschiebungen erfasst.</DataTableEmpty>
          ) : (
            device.moves.map((move) => (
              <TableRow key={move.id}>
                <DataTableCell className="font-mono tabular-nums">{formatDate(move.effectiveOn)}</DataTableCell>
                <DataTableCell>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-muted-foreground">{move.fromLocation.name}</span>
                    <ArrowRightIcon aria-hidden className="size-3.5 text-muted-foreground" />
                    <span className="font-medium">{move.toLocation.name}</span>
                  </span>
                </DataTableCell>
                <DataTableCell className="max-w-md">
                  {move.note ? (
                    <span className="line-clamp-2 whitespace-normal text-muted-foreground">{move.note}</span>
                  ) : (
                    <span className="text-muted-foreground">–</span>
                  )}
                </DataTableCell>
                <DataTableCell className="py-1.5 text-right">
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-destructive hover:text-destructive"
                    onClick={() => openDelete(move)}
                  >
                    Löschen
                  </Button>
                </DataTableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>

      <MoveDialog open={moveOpen} onOpenChange={setMoveOpen} device={device} locations={locations} />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={
          deleteTarget
            ? `Verschiebung nach «${deleteTarget.toLocation.name}» ab ${formatDate(deleteTarget.effectiveOn)} löschen?`
            : "Verschiebung löschen?"
        }
        description="Die Verschiebung wird dauerhaft gelöscht; der Standort des Geräts ab diesem Datum ändert sich entsprechend."
        onConfirm={handleDelete}
      />
    </section>
  );
}
