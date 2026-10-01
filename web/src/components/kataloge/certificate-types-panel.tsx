"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { DataTable, DataTableCell, DataTableEmpty, DataTableHead } from "@/components/data/data-table";
import { ConfirmDialog } from "@/components/form/confirm-dialog";
import { Button } from "@/components/ui/button";
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import { deleteCertificateType, type CertificateType, type CourseTypeRef } from "@/lib/api/certificate-types";
import { ApiError } from "@/lib/api/client";
import { CertificateTypeDialog } from "./certificate-type-dialog";

const COLUMNS = 7;

/** «5 Jahre» or «läuft nicht ab». */
function formatValidity(years: number | null): string {
  if (years === null) return "läuft nicht ab";
  return `${years} ${years === 1 ? "Jahr" : "Jahre"}`;
}

/** «60 Tage». */
function formatWarning(days: number): string {
  return `${days} ${days === 1 ? "Tag" : "Tage"}`;
}

/** «5 × pro Jahr: ÜK 7, ÜK 8», or `null` when the type has no Qualifikationspflege. */
function formatMaintenance(type: CertificateType): string | null {
  if (type.maintenanceMinPerYear === null) return null;
  const codes = type.maintenanceCourseTypes.map((c) => c.code).join(", ");
  return `${type.maintenanceMinPerYear} × pro Jahr${codes ? `: ${codes}` : ""}`;
}

type CertificateTypesPanelProps = {
  types: CertificateType[];
  /** Kurstypen for the dialog's picker; `null` when they could not be loaded. */
  courseTypes: CourseTypeRef[] | null;
};

/** Tab «Zertifikatstypen»: table with per-row edit and delete, plus «Zertifikatstyp anlegen». */
export function CertificateTypesPanel({ types, courseTypes }: CertificateTypesPanelProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CertificateType | undefined>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CertificateType | undefined>();

  function openCreate() {
    setEditTarget(undefined);
    setDialogOpen(true);
  }

  function openEdit(type: CertificateType) {
    setEditTarget(type);
    setDialogOpen(true);
  }

  function openDelete(type: CertificateType) {
    setDeleteTarget(type);
    setConfirmOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteCertificateType(deleteTarget.id);
      toast.success("Zertifikatstyp gelöscht");
      router.refresh();
    } catch (error) {
      // 409 while certificates, Kurstypen or Gerätetypen reference the type: the API names the reason.
      toast.error(error instanceof ApiError ? error.message : "Unerwarteter Fehler.");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {types.length} {types.length === 1 ? "Zertifikatstyp" : "Zertifikatstypen"}
        </p>
        <Button variant="outline" size="sm" onClick={openCreate}>
          <PlusIcon data-icon="inline-start" />
          Zertifikatstyp anlegen
        </Button>
      </div>

      <DataTable>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DataTableHead>Code</DataTableHead>
            <DataTableHead>Name</DataTableHead>
            <DataTableHead>Aussteller</DataTableHead>
            <DataTableHead>Gültigkeit</DataTableHead>
            <DataTableHead>Warnfrist</DataTableHead>
            <DataTableHead>Qualifikationspflege</DataTableHead>
            <DataTableHead className="w-0">
              <span className="sr-only">Aktionen</span>
            </DataTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {types.length === 0 ? (
            <DataTableEmpty colSpan={COLUMNS}>Noch keine Zertifikatstypen erfasst.</DataTableEmpty>
          ) : (
            types.map((type) => {
              const maintenance = formatMaintenance(type);
              return (
                <TableRow key={type.id}>
                  <DataTableCell className="font-mono">{type.code}</DataTableCell>
                  <DataTableCell className="font-medium">{type.name}</DataTableCell>
                  <DataTableCell>{type.issuer ?? <span className="text-muted-foreground">–</span>}</DataTableCell>
                  <DataTableCell className={type.validityYears === null ? "text-muted-foreground" : undefined}>
                    {formatValidity(type.validityYears)}
                  </DataTableCell>
                  <DataTableCell>{formatWarning(type.warningLeadDays)}</DataTableCell>
                  <DataTableCell>{maintenance ?? <span className="text-muted-foreground">–</span>}</DataTableCell>
                  <DataTableCell className="py-1.5 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="xs" onClick={() => openEdit(type)}>
                        Bearbeiten
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-destructive hover:text-destructive"
                        onClick={() => openDelete(type)}
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

      <CertificateTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={editTarget}
        courseTypes={courseTypes}
      />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={deleteTarget ? `Zertifikatstyp «${deleteTarget.name}» löschen?` : "Zertifikatstyp löschen?"}
        description="Der Zertifikatstyp wird dauerhaft gelöscht. Solange Zertifikate, Kurstypen oder Gerätetypen darauf verweisen, wird das Löschen abgelehnt."
        onConfirm={handleDelete}
      />
    </div>
  );
}
