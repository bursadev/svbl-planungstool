"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { DataTable, DataTableCell, DataTableEmpty, DataTableHead } from "@/components/data";
import { ConfirmDialog } from "@/components/form";
import { Button } from "@/components/ui/button";
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api";
import { deleteParticipant, type Participant } from "@/lib/api/customers";
import { LANGUAGE_SHORT_LABELS } from "@/lib/labels";
import { ParticipantDialog, type CustomerOption } from "./participant-dialog";

type ParticipantsPanelProps = {
  participants: Participant[];
  /** Options of the Kunde picker in the dialog. */
  customers: CustomerOption[];
  /** Set on the Kunde detail page: fixes the Kunde and hides the column. */
  lockedCustomerId?: string;
};

/** Teilnehmende with per-row edit and delete, plus «Teilnehmer/in hinzufügen». */
export function ParticipantsPanel({ participants, customers, lockedCustomerId }: ParticipantsPanelProps) {
  const router = useRouter();
  const showCustomer = !lockedCustomerId;
  const columns = showCustomer ? 5 : 4;
  // The dialogs keep their last target while closing, so the title does not flip mid-animation.
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Participant | undefined>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Participant | undefined>();

  function openCreate() {
    setEditTarget(undefined);
    setDialogOpen(true);
  }

  function openEdit(participant: Participant) {
    setEditTarget(participant);
    setDialogOpen(true);
  }

  function openDelete(participant: Participant) {
    setDeleteTarget(participant);
    setConfirmOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteParticipant(deleteTarget.id);
      toast.success("Teilnehmer/in gelöscht");
      router.refresh();
    } catch (error) {
      // 409 while Kursanmeldungen still reference the Teilnehmer/in.
      toast.error(error instanceof ApiError ? error.message : "Unerwarteter Fehler.");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{participants.length} Teilnehmende</p>
        <Button variant="outline" size="sm" onClick={openCreate}>
          <PlusIcon data-icon="inline-start" />
          Teilnehmer/in hinzufügen
        </Button>
      </div>

      <DataTable>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DataTableHead>Name</DataTableHead>
            <DataTableHead>Kontakt</DataTableHead>
            {showCustomer ? <DataTableHead>Kunde</DataTableHead> : null}
            <DataTableHead>Sprache</DataTableHead>
            <DataTableHead className="w-0">
              <span className="sr-only">Aktionen</span>
            </DataTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {participants.length === 0 ? (
            <DataTableEmpty colSpan={columns}>Noch keine Teilnehmenden erfasst.</DataTableEmpty>
          ) : (
            participants.map((participant) => (
              <TableRow key={participant.id}>
                <DataTableCell className="font-medium">
                  {participant.firstName} {participant.lastName}
                </DataTableCell>
                <DataTableCell className="max-w-xs">
                  {participant.email || participant.phone ? (
                    <>
                      {participant.email ? <div className="truncate">{participant.email}</div> : null}
                      {participant.phone ? (
                        <div className="truncate text-xs text-muted-foreground">{participant.phone}</div>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-muted-foreground">–</span>
                  )}
                </DataTableCell>
                {showCustomer ? (
                  <DataTableCell className="max-w-xs">
                    {participant.customer ? (
                      <Link href={`/kunden/${participant.customer.id}`} className="truncate hover:underline">
                        {participant.customer.name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </DataTableCell>
                ) : null}
                <DataTableCell>{LANGUAGE_SHORT_LABELS[participant.language]}</DataTableCell>
                <DataTableCell className="py-1.5 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="xs" onClick={() => openEdit(participant)}>
                      Bearbeiten
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-destructive hover:text-destructive"
                      onClick={() => openDelete(participant)}
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

      <ParticipantDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customers={customers}
        lockedCustomerId={lockedCustomerId}
        participant={editTarget}
      />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={
          deleteTarget
            ? `«${deleteTarget.firstName} ${deleteTarget.lastName}» löschen?`
            : "Teilnehmer/in löschen?"
        }
        description="Die Person wird dauerhaft gelöscht."
        onConfirm={handleDelete}
      />
    </div>
  );
}
