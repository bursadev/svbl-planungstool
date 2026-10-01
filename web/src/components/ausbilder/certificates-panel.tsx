"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLinkIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { DataTable, DataTableCell, DataTableEmpty, DataTableHead, StatusDot } from "@/components/data";
import { ConfirmDialog } from "@/components/form";
import { Button } from "@/components/ui/button";
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api";
import type { CertificateTypeRef } from "@/lib/api/certificate-types-ref";
import { deleteCertificate, type InstructorCertificate } from "@/lib/api/instructors";
import { formatDate } from "@/lib/format";
import { CertificateDialog } from "./certificate-dialog";
import { CERTIFICATE_STATUS_TONES, certificateStatusLabel } from "./labels";

const COLUMNS = 6;

type CertificatesPanelProps = {
  instructorId: string;
  certificates: InstructorCertificate[];
  types: CertificateTypeRef[];
};

/** Tab «Zertifikate»: table with per-row edit and delete, plus «Zertifikat erfassen». */
export function CertificatesPanel({ instructorId, certificates, types }: CertificatesPanelProps) {
  const router = useRouter();
  // The dialogs keep their last target while closing, so the title does not flip mid-animation.
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<InstructorCertificate | undefined>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InstructorCertificate | undefined>();

  function openCreate() {
    setEditTarget(undefined);
    setDialogOpen(true);
  }

  function openEdit(certificate: InstructorCertificate) {
    setEditTarget(certificate);
    setDialogOpen(true);
  }

  function openDelete(certificate: InstructorCertificate) {
    setDeleteTarget(certificate);
    setConfirmOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteCertificate(deleteTarget.id);
      toast.success("Zertifikat gelöscht");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unerwarteter Fehler.");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {certificates.length} {certificates.length === 1 ? "Zertifikat" : "Zertifikate"}
        </p>
        <Button variant="outline" size="sm" onClick={openCreate}>
          <PlusIcon data-icon="inline-start" />
          Zertifikat erfassen
        </Button>
      </div>

      <DataTable>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DataTableHead>Zertifikat</DataTableHead>
            <DataTableHead>Aussteller</DataTableHead>
            <DataTableHead>Ausgestellt</DataTableHead>
            <DataTableHead>Gültig bis</DataTableHead>
            <DataTableHead>Status</DataTableHead>
            <DataTableHead className="w-0">
              <span className="sr-only">Aktionen</span>
            </DataTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {certificates.length === 0 ? (
            <DataTableEmpty colSpan={COLUMNS}>Noch keine Zertifikate erfasst.</DataTableEmpty>
          ) : (
            certificates.map((certificate) => (
              <TableRow key={certificate.id}>
                <DataTableCell className="max-w-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-medium">{certificate.certificateType.name}</span>
                    {certificate.documentUrl ? (
                      <a
                        href={certificate.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Dokument öffnen"
                        aria-label="Dokument öffnen"
                        className="text-muted-foreground hover:text-accent"
                      >
                        <ExternalLinkIcon aria-hidden className="size-3.5" />
                      </a>
                    ) : null}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">{certificate.certificateType.code}</div>
                </DataTableCell>
                <DataTableCell>
                  {certificate.certificateType.issuer ?? <span className="text-muted-foreground">–</span>}
                </DataTableCell>
                <DataTableCell className="font-mono tabular-nums">{formatDate(certificate.issuedOn)}</DataTableCell>
                <DataTableCell className="font-mono tabular-nums">
                  {certificate.validUntil ? (
                    formatDate(certificate.validUntil)
                  ) : (
                    <span className="font-sans text-muted-foreground">unbefristet</span>
                  )}
                </DataTableCell>
                <DataTableCell>
                  <StatusDot tone={CERTIFICATE_STATUS_TONES[certificate.status]} label={certificateStatusLabel(certificate)} />
                </DataTableCell>
                <DataTableCell className="py-1.5 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="xs" onClick={() => openEdit(certificate)}>
                      Bearbeiten
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-destructive hover:text-destructive"
                      onClick={() => openDelete(certificate)}
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

      <CertificateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        instructorId={instructorId}
        types={types}
        certificate={editTarget}
      />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={deleteTarget ? `Zertifikat «${deleteTarget.certificateType.name}» löschen?` : "Zertifikat löschen?"}
        description="Das Zertifikat wird dauerhaft gelöscht."
        onConfirm={handleDelete}
      />
    </div>
  );
}
