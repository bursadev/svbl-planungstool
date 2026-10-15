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
import { deleteSetting, type Setting } from "@/lib/api/settings";
import { formatDate } from "@/lib/format";
import { SettingDialog } from "./setting-dialog";

/** One line of JSON for the table cell. */
function formatValue(value: unknown): string {
  return JSON.stringify(value);
}

/** Key/value settings table; admins add, edit and delete, everyone else reads. */
export function SettingsPanel({ settings, canEdit }: { settings: Setting[]; canEdit: boolean }) {
  const router = useRouter();
  const columns = canEdit ? 4 : 3;
  // The dialogs keep their last target while closing, so the title does not flip mid-animation.
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Setting | undefined>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Setting | undefined>();

  function openCreate() {
    setEditTarget(undefined);
    setDialogOpen(true);
  }

  function openEdit(setting: Setting) {
    setEditTarget(setting);
    setDialogOpen(true);
  }

  function openDelete(setting: Setting) {
    setDeleteTarget(setting);
    setConfirmOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteSetting(deleteTarget.key);
      toast.success("Einstellung gelöscht");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unerwarteter Fehler.");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {canEdit ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {settings.length} {settings.length === 1 ? "Einstellung" : "Einstellungen"}
          </p>
          <Button variant="outline" size="sm" onClick={openCreate}>
            <PlusIcon data-icon="inline-start" />
            Einstellung hinzufügen
          </Button>
        </div>
      ) : null}

      <DataTable>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DataTableHead>Schlüssel</DataTableHead>
            <DataTableHead>Wert</DataTableHead>
            <DataTableHead>Geändert</DataTableHead>
            {canEdit ? (
              <DataTableHead className="w-0">
                <span className="sr-only">Aktionen</span>
              </DataTableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {settings.length === 0 ? (
            <DataTableEmpty colSpan={columns}>Noch keine Einstellungen erfasst.</DataTableEmpty>
          ) : (
            settings.map((setting) => (
              <TableRow key={setting.key}>
                <DataTableCell className="font-mono font-medium">{setting.key}</DataTableCell>
                <DataTableCell className="max-w-md">
                  <span className="block truncate font-mono text-xs">{formatValue(setting.value)}</span>
                </DataTableCell>
                <DataTableCell>
                  <span className="font-mono tabular-nums">{formatDate(setting.updatedAt)}</span>
                  {setting.updatedBy ? (
                    <span className="text-xs text-muted-foreground"> · {setting.updatedBy}</span>
                  ) : null}
                </DataTableCell>
                {canEdit ? (
                  <DataTableCell className="py-1.5 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="xs" onClick={() => openEdit(setting)}>
                        Bearbeiten
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-destructive hover:text-destructive"
                        onClick={() => openDelete(setting)}
                      >
                        Löschen
                      </Button>
                    </div>
                  </DataTableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>

      <SettingDialog open={dialogOpen} onOpenChange={setDialogOpen} setting={editTarget} />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={deleteTarget ? `«${deleteTarget.key}» löschen?` : "Einstellung löschen?"}
        description="Die Einstellung wird dauerhaft gelöscht."
        onConfirm={handleDelete}
      />
    </div>
  );
}
