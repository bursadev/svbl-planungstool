"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataTable, DataTableCell, DataTableEmpty, DataTableHead } from "@/components/data/data-table";
import { LinkRow } from "@/components/data/link-row";
import { StatusDot } from "@/components/data/status-dot";
import { ConfirmDialog } from "@/components/form/confirm-dialog";
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import { deleteDevice, getDevice, type DeviceRow } from "@/lib/api/devices";
import { formatDate } from "@/lib/format";
import { DEVICE_MOBILITY_LABELS, DEVICE_STATUS_LABELS } from "@/lib/labels";
import { DeviceDialog, type EditableDevice } from "./device-dialog";
import { DeviceRowMenu } from "./device-row-menu";
import { DEVICE_STATUS_TONES, type PickerOption } from "./labels";
import { MaintenanceDialog } from "./maintenance-dialog";
import { MoveDialog } from "./move-dialog";

const COLUMNS = 7;

type DialogKind = "edit" | "move" | "maintenance" | "delete";

/** «1.3.2026 – 30.6.2026 · Anbieter» for a Miete, else «ab 1.3.2026 nach Basel», else `null`. */
function formatPeriod(device: DeviceRow): string | null {
  if (device.mobility === "rental" && (device.rentalFrom || device.rentalUntil || device.rentalVendor)) {
    const range =
      device.rentalFrom && device.rentalUntil
        ? `${formatDate(device.rentalFrom)} – ${formatDate(device.rentalUntil)}`
        : device.rentalFrom
          ? `ab ${formatDate(device.rentalFrom)}`
          : device.rentalUntil
            ? `bis ${formatDate(device.rentalUntil)}`
            : null;
    return [range, device.rentalVendor].filter(Boolean).join(" · ");
  }
  if (device.lastMove) {
    return `ab ${formatDate(device.lastMove.effectiveOn)} nach ${device.lastMove.toLocation.name}`;
  }
  return null;
}

type DevicesTableProps = {
  devices: DeviceRow[];
  deviceTypes: PickerOption[];
  locations: PickerOption[];
};

/** The `/geraete` list; rows link to the detail page, the «Aktionen» menu opens the dialogs. */
export function DevicesTable({ devices, deviceTypes, locations }: DevicesTableProps) {
  const router = useRouter();
  // One dialog of each kind for the whole table; the target stays while a dialog closes.
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const [target, setTarget] = useState<DeviceRow | undefined>();
  const [editTarget, setEditTarget] = useState<EditableDevice | undefined>();

  function open(kind: Exclude<DialogKind, "edit">, device: DeviceRow) {
    setTarget(device);
    setDialog(kind);
  }

  /** The list row has no notes, so the detail is loaded first; editing must not wipe them. */
  async function openEdit(device: DeviceRow) {
    try {
      setEditTarget(await getDevice(device.id));
      setDialog("edit");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unerwarteter Fehler.");
    }
  }

  function closeIf(kind: DialogKind) {
    return (next: boolean) => {
      if (!next && dialog === kind) setDialog(null);
    };
  }

  async function handleDelete() {
    if (!target) return;
    try {
      await deleteDevice(target.id);
      toast.success("Gerät gelöscht");
      router.refresh();
    } catch (error) {
      // 409 while reservations reference the device: the API names the reason.
      toast.error(error instanceof ApiError ? error.message : "Unerwarteter Fehler.");
    }
  }

  return (
    <>
      <DataTable>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DataTableHead>Inventar</DataTableHead>
            <DataTableHead>Typ</DataTableHead>
            <DataTableHead>Standort heute</DataTableHead>
            <DataTableHead>Mobilität</DataTableHead>
            <DataTableHead>Status</DataTableHead>
            <DataTableHead>Zeitraum / Bewegung</DataTableHead>
            <DataTableHead className="w-0">
              <span className="sr-only">Aktionen</span>
            </DataTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.length === 0 ? (
            <DataTableEmpty colSpan={COLUMNS}>Keine Geräte gefunden.</DataTableEmpty>
          ) : (
            devices.map((device) => {
              const href = `/geraete/${device.id}`;
              const period = formatPeriod(device);
              const away = device.currentLocation.id !== device.homeLocation.id;
              return (
                <LinkRow key={device.id} href={href}>
                  <DataTableCell>
                    <Link
                      href={href}
                      className="font-mono font-medium outline-none hover:underline focus-visible:underline"
                    >
                      {device.inventoryNumber}
                    </Link>
                  </DataTableCell>
                  <DataTableCell>
                    <div>{device.deviceType.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{device.deviceType.code}</div>
                  </DataTableCell>
                  <DataTableCell>
                    <div>{device.currentLocation.name}</div>
                    {away ? (
                      <div className="text-xs text-muted-foreground">Heimstandort: {device.homeLocation.name}</div>
                    ) : null}
                  </DataTableCell>
                  <DataTableCell>{DEVICE_MOBILITY_LABELS[device.mobility]}</DataTableCell>
                  <DataTableCell>
                    <StatusDot tone={DEVICE_STATUS_TONES[device.status]} label={DEVICE_STATUS_LABELS[device.status]} />
                  </DataTableCell>
                  <DataTableCell className="max-w-xs">
                    {period ? <span className="truncate">{period}</span> : <span className="text-muted-foreground">–</span>}
                  </DataTableCell>
                  <DataTableCell className="py-1.5 text-right" onClick={(event) => event.stopPropagation()}>
                    <DeviceRowMenu
                      device={device}
                      onEdit={() => void openEdit(device)}
                      onMove={() => open("move", device)}
                      onMaintenance={() => open("maintenance", device)}
                      onDelete={() => open("delete", device)}
                    />
                  </DataTableCell>
                </LinkRow>
              );
            })
          )}
        </TableBody>
      </DataTable>

      <DeviceDialog
        open={dialog === "edit"}
        onOpenChange={closeIf("edit")}
        device={editTarget}
        deviceTypes={deviceTypes}
        locations={locations}
      />
      <MoveDialog open={dialog === "move"} onOpenChange={closeIf("move")} device={target} locations={locations} />
      <MaintenanceDialog open={dialog === "maintenance"} onOpenChange={closeIf("maintenance")} deviceId={target?.id} />
      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={closeIf("delete")}
        title={target ? `Gerät «${target.inventoryNumber}» löschen?` : "Gerät löschen?"}
        description="Das Gerät wird dauerhaft gelöscht, zusammen mit seinen Verschiebungen und Wartungsfenstern."
        onConfirm={handleDelete}
      />
    </>
  );
}
