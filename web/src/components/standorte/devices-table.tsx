import { DataTable, DataTableCell, DataTableEmpty, DataTableHead, StatusDot, type StatusTone } from "@/components/data";
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import type { DeviceRow, DeviceStatus } from "@/lib/api/devices";
import { formatDate } from "@/lib/format";
import { DEVICE_MOBILITY_LABELS, DEVICE_STATUS_LABELS } from "@/lib/labels";

const COLUMNS = 5;

const STATUS_TONES: Record<DeviceStatus, StatusTone> = {
  available: "ok",
  maintenance: "warn",
  retired: "bad",
};

/** Tab «Geräte»: read-only list of the devices whose home is this Standort; `null` when the API failed. */
export function DevicesTable({ devices }: { devices: DeviceRow[] | null }) {
  if (devices === null) {
    return <p className="py-3 text-sm text-muted-foreground">Geräte konnten nicht geladen werden.</p>;
  }

  return (
    <DataTable>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <DataTableHead>Inventar</DataTableHead>
          <DataTableHead>Typ</DataTableHead>
          <DataTableHead>Standort heute</DataTableHead>
          <DataTableHead>Mobilität</DataTableHead>
          <DataTableHead>Status</DataTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {devices.length === 0 ? (
          <DataTableEmpty colSpan={COLUMNS}>Keine Geräte an diesem Standort.</DataTableEmpty>
        ) : (
          devices.map((device) => (
            <TableRow key={device.id}>
              <DataTableCell className="font-mono">{device.inventoryNumber}</DataTableCell>
              <DataTableCell>
                <div>{device.deviceType.name}</div>
                <div className="font-mono text-xs text-muted-foreground">{device.deviceType.code}</div>
              </DataTableCell>
              <DataTableCell>
                {device.currentLocation.name}
                {device.currentLocation.id !== device.homeLocation.id ? (
                  <div className="text-xs text-muted-foreground">verschoben</div>
                ) : null}
              </DataTableCell>
              <DataTableCell>
                {DEVICE_MOBILITY_LABELS[device.mobility]}
                {device.mobility === "rental" && device.rentalUntil ? (
                  <div className="text-xs text-muted-foreground">bis {formatDate(device.rentalUntil)}</div>
                ) : null}
              </DataTableCell>
              <DataTableCell>
                <StatusDot tone={STATUS_TONES[device.status]} label={DEVICE_STATUS_LABELS[device.status]} />
              </DataTableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </DataTable>
  );
}
