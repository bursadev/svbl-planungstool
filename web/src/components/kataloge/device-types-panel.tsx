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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import type { CertificateType } from "@/lib/api/certificate-types";
import { ApiError } from "@/lib/api/client";
import { DEVICE_TYPES_PATH, deleteDeviceType, type DeviceType } from "@/lib/api/device-types";
import type { Skill } from "@/lib/api/skills";
import { CatalogToolbar } from "./catalog-toolbar";
import { DeviceTypeDialog } from "./device-type-dialog";
import { DEVICE_CATEGORY_LABELS } from "@/lib/labels";

const COLUMNS = 7;

type DeviceTypesPanelProps = {
  types: DeviceType[];
  /** All Zertifikatstypen and Skills (not the filtered tabs) for the dialog's pickers. */
  certificateTypes: CertificateType[];
  skills: Skill[];
  /** API filters of the view, for the filtered CSV export. */
  filters: Record<string, string | undefined>;
  filtered: boolean;
};

/**
 * Tab «Gerätetypen»: toolbar with search, archive filter and CSV, a selectable table for bulk
 * archive / restore / delete, and per-row edit and delete.
 */
export function DeviceTypesPanel({ types, certificateTypes, skills, filters, filtered }: DeviceTypesPanelProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DeviceType | undefined>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeviceType | undefined>();

  function openCreate() {
    setEditTarget(undefined);
    setDialogOpen(true);
  }

  function openEdit(type: DeviceType) {
    setEditTarget(type);
    setDialogOpen(true);
  }

  function openDelete(type: DeviceType) {
    setDeleteTarget(type);
    setConfirmOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteDeviceType(deleteTarget.id);
      toast.success("Gerätetyp gelöscht");
      router.refresh();
    } catch (error) {
      // 409 while devices or Kurstypen reference the type: the API names the reason.
      toast.error(error instanceof ApiError ? error.message : "Unerwarteter Fehler.");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <CatalogToolbar
        basePath={DEVICE_TYPES_PATH}
        plural="Gerätetypen"
        searchPlaceholder="Code, Name"
        filters={filters}
        filtered={filtered}
      >
        <Button onClick={openCreate}>
          <PlusIcon data-icon="inline-start" />
          Gerätetyp anlegen
        </Button>
      </CatalogToolbar>

      <SelectionProvider ids={types.map((type) => type.id)}>
        <BulkBar basePath={DEVICE_TYPES_PATH} plural="Gerätetypen" />
        <DataTable>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <SelectAllHead />
              <DataTableHead>Code</DataTableHead>
              <DataTableHead>Name</DataTableHead>
              <DataTableHead>Kategorie</DataTableHead>
              <DataTableHead>Qualifikation</DataTableHead>
              <DataTableHead>Status</DataTableHead>
              <DataTableHead className="w-0">
                <span className="sr-only">Aktionen</span>
              </DataTableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {types.length === 0 ? (
              <DataTableEmpty colSpan={COLUMNS}>
                {filtered ? "Keine Gerätetypen gefunden." : "Noch keine Gerätetypen erfasst."}
              </DataTableEmpty>
            ) : (
              types.map((type) => {
                const { certificateTypes: certs, skills: typeSkills } = type.qualifications;
                return (
                  <TableRow key={type.id}>
                    <SelectCell id={type.id} label={type.name} />
                    <DataTableCell className="font-mono">{type.code}</DataTableCell>
                    <DataTableCell className="font-medium">{type.name}</DataTableCell>
                    <DataTableCell>{DEVICE_CATEGORY_LABELS[type.category]}</DataTableCell>
                    <DataTableCell className="max-w-md whitespace-normal">
                      {certs.length === 0 && typeSkills.length === 0 ? (
                        <span className="text-muted-foreground">–</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {certs.map((cert) => (
                            <Badge
                              key={cert.id}
                              variant="outline"
                              className="border-transparent bg-accent-soft font-mono text-accent"
                              title={cert.name}
                            >
                              {cert.code}
                            </Badge>
                          ))}
                          {typeSkills.map((skill) => (
                            <Badge key={skill.id} variant="secondary">
                              {skill.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </DataTableCell>
                    <DataTableCell>
                      <ActiveBadge active={type.active} />
                    </DataTableCell>
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
      </SelectionProvider>

      <DeviceTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={editTarget}
        certificateTypes={certificateTypes}
        skills={skills}
      />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={deleteTarget ? `Gerätetyp «${deleteTarget.name}» löschen?` : "Gerätetyp löschen?"}
        description="Der Gerätetyp wird dauerhaft gelöscht. Solange Geräte oder Kurstypen darauf verweisen, wird das Löschen abgelehnt."
        onConfirm={handleDelete}
      />
    </div>
  );
}
