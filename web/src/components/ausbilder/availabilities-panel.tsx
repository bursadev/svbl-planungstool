"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { DataTable, DataTableCell, DataTableEmpty, DataTableHead, StatusDot } from "@/components/data";
import { ConfirmDialog } from "@/components/form";
import { Button } from "@/components/ui/button";
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api";
import {
  approveAvailability,
  deleteAvailability,
  rejectAvailability,
  type Availability,
} from "@/lib/api/instructors";
import { formatDate } from "@/lib/format";
import { AvailabilityDialog } from "./availability-dialog";
import { AVAILABILITY_KIND_LABELS, AVAILABILITY_STATUS_LABELS } from "@/lib/labels";
import { AVAILABILITY_STATUS_TONES } from "./labels";

const COLUMNS = 6;

type AvailabilitiesPanelProps = {
  instructorId: string;
  /** Newest first, as the API returns them. */
  availabilities: Availability[];
};

/**
 * Tab «Verfügbarkeit»: the list of periods with Genehmigen/Ablehnen for requests, edit and delete,
 * plus «Absenz erfassen». The 8-week grid comes with the planning slice.
 */
export function AvailabilitiesPanel({ instructorId, availabilities }: AvailabilitiesPanelProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Availability | undefined>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Availability | undefined>();
  /** Id of the row whose approve/reject request is in flight. */
  const [decidingId, setDecidingId] = useState<string | null>(null);

  function openCreate() {
    setEditTarget(undefined);
    setDialogOpen(true);
  }

  function openEdit(availability: Availability) {
    setEditTarget(availability);
    setDialogOpen(true);
  }

  function openDelete(availability: Availability) {
    setDeleteTarget(availability);
    setConfirmOpen(true);
  }

  async function handleDecide(availability: Availability, decision: "approve" | "reject") {
    setDecidingId(availability.id);
    try {
      if (decision === "approve") {
        await approveAvailability(availability.id);
        toast.success("Genehmigt");
      } else {
        await rejectAvailability(availability.id);
        toast.success("Abgelehnt");
      }
      router.refresh();
    } catch (error) {
      // 409 «Der Antrag ist bereits entschieden.» when someone else was faster.
      toast.error(error instanceof ApiError ? error.message : "Unerwarteter Fehler.");
    } finally {
      setDecidingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteAvailability(deleteTarget.id);
      toast.success("Absenz gelöscht");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unerwarteter Fehler.");
    }
  }

  const requested = availabilities.filter((availability) => availability.status === "requested").length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {availabilities.length} {availabilities.length === 1 ? "Eintrag" : "Einträge"}
          {requested > 0 ? ` · ${requested} offen` : null}
        </p>
        <Button variant="outline" size="sm" onClick={openCreate}>
          <PlusIcon data-icon="inline-start" />
          Absenz erfassen
        </Button>
      </div>

      <DataTable>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DataTableHead>Von</DataTableHead>
            <DataTableHead>Bis</DataTableHead>
            <DataTableHead>Art</DataTableHead>
            <DataTableHead>Status</DataTableHead>
            <DataTableHead>Notiz</DataTableHead>
            <DataTableHead className="w-0">
              <span className="sr-only">Aktionen</span>
            </DataTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {availabilities.length === 0 ? (
            <DataTableEmpty colSpan={COLUMNS}>Noch keine Absenzen erfasst.</DataTableEmpty>
          ) : (
            availabilities.map((availability) => {
              const deciding = decidingId === availability.id;
              return (
                <TableRow key={availability.id}>
                  <DataTableCell className="font-mono tabular-nums">{formatDate(availability.startsOn)}</DataTableCell>
                  <DataTableCell className="font-mono tabular-nums">{formatDate(availability.endsOn)}</DataTableCell>
                  <DataTableCell>{AVAILABILITY_KIND_LABELS[availability.kind]}</DataTableCell>
                  <DataTableCell>
                    <StatusDot
                      tone={AVAILABILITY_STATUS_TONES[availability.status]}
                      label={AVAILABILITY_STATUS_LABELS[availability.status]}
                    />
                  </DataTableCell>
                  <DataTableCell className="max-w-xs truncate text-muted-foreground" title={availability.note ?? undefined}>
                    {availability.note || "–"}
                  </DataTableCell>
                  <DataTableCell className="py-1.5 text-right">
                    <div className="flex justify-end gap-1">
                      {availability.status === "requested" ? (
                        <>
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-ok hover:text-ok"
                            disabled={deciding}
                            onClick={() => handleDecide(availability, "approve")}
                          >
                            Genehmigen
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            disabled={deciding}
                            onClick={() => handleDecide(availability, "reject")}
                          >
                            Ablehnen
                          </Button>
                        </>
                      ) : null}
                      <Button variant="ghost" size="xs" disabled={deciding} onClick={() => openEdit(availability)}>
                        Bearbeiten
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-destructive hover:text-destructive"
                        disabled={deciding}
                        onClick={() => openDelete(availability)}
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

      <AvailabilityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        instructorId={instructorId}
        availability={editTarget}
      />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={
          deleteTarget
            ? `${AVAILABILITY_KIND_LABELS[deleteTarget.kind]} ${formatDate(deleteTarget.startsOn)} – ${formatDate(deleteTarget.endsOn)} löschen?`
            : "Absenz löschen?"
        }
        description="Der Eintrag wird dauerhaft gelöscht."
        onConfirm={handleDelete}
      />
    </div>
  );
}
