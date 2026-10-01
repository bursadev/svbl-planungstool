"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { ActiveBadge, DataTable, DataTableCell, DataTableEmpty, DataTableHead } from "@/components/data";
import { ConfirmDialog } from "@/components/form";
import { Button } from "@/components/ui/button";
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api";
import { deleteRoom, type Room } from "@/lib/api/locations";
import { ROOM_KIND_LABELS } from "@/lib/labels";
import { RoomDialog } from "./room-dialog";

const COLUMNS = 5;

/** Tab «Räume»: table with per-row edit and delete, plus «Raum hinzufügen». */
export function RoomsPanel({ locationId, rooms }: { locationId: string; rooms: Room[] }) {
  const router = useRouter();
  // The dialogs keep their last target while closing, so the title does not flip mid-animation.
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Room | undefined>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Room | undefined>();

  function openCreate() {
    setEditTarget(undefined);
    setDialogOpen(true);
  }

  function openEdit(room: Room) {
    setEditTarget(room);
    setDialogOpen(true);
  }

  function openDelete(room: Room) {
    setDeleteTarget(room);
    setConfirmOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteRoom(deleteTarget.id);
      toast.success("Raum gelöscht");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unerwarteter Fehler.");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {rooms.length} {rooms.length === 1 ? "Raum" : "Räume"}
        </p>
        <Button variant="outline" size="sm" onClick={openCreate}>
          <PlusIcon data-icon="inline-start" />
          Raum hinzufügen
        </Button>
      </div>

      <DataTable>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DataTableHead>Raum</DataTableHead>
            <DataTableHead>Art</DataTableHead>
            <DataTableHead className="text-right">Plätze</DataTableHead>
            <DataTableHead>Status</DataTableHead>
            <DataTableHead className="w-0">
              <span className="sr-only">Aktionen</span>
            </DataTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rooms.length === 0 ? (
            <DataTableEmpty colSpan={COLUMNS}>Noch keine Räume erfasst.</DataTableEmpty>
          ) : (
            rooms.map((room) => (
              <TableRow key={room.id}>
                <DataTableCell className="font-medium">{room.name}</DataTableCell>
                <DataTableCell>{ROOM_KIND_LABELS[room.kind]}</DataTableCell>
                <DataTableCell className="text-right font-mono tabular-nums">
                  {room.capacity ?? <span className="text-muted-foreground">–</span>}
                </DataTableCell>
                <DataTableCell>
                  <ActiveBadge active={room.active} />
                </DataTableCell>
                <DataTableCell className="py-1.5 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="xs" onClick={() => openEdit(room)}>
                      Bearbeiten
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-destructive hover:text-destructive"
                      onClick={() => openDelete(room)}
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

      <RoomDialog open={dialogOpen} onOpenChange={setDialogOpen} locationId={locationId} room={editTarget} />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={deleteTarget ? `Raum «${deleteTarget.name}» löschen?` : "Raum löschen?"}
        description="Der Raum wird dauerhaft gelöscht."
        onConfirm={handleDelete}
      />
    </div>
  );
}
