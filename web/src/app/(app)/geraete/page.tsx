import type { Metadata } from "next";
import { CreateDeviceButton } from "@/components/geraete/create-device-button";
import { DevicesTable } from "@/components/geraete/devices-table";
import { FiltersBar } from "@/components/geraete/filters-bar";
import { toPickerOptions } from "@/components/geraete/labels";
import { PageHeader } from "@/components/shell/page-header";
import { listDeviceTypes } from "@/lib/api/device-types";
import { listDevices, type DeviceFilters, type DeviceMobility, type DeviceStatus } from "@/lib/api/devices";
import { listLocations } from "@/lib/api/locations";
import { serverApiFetch } from "@/lib/api/server";

export const metadata: Metadata = { title: "Geräte" };

type GeraetePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const MOBILITIES: readonly DeviceMobility[] = ["fixed", "mobile", "rental"];
const STATUSES: readonly DeviceStatus[] = ["available", "maintenance", "retired"];

function first(value: string | string[] | undefined): string | undefined {
  return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
}

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

/** «26 Geräte · 3 in Wartung · 2 Miete» for the current filter. */
function summarize(devices: { status: DeviceStatus; mobility: DeviceMobility }[]): string {
  const total = devices.length;
  const maintenance = devices.filter((d) => d.status === "maintenance").length;
  const rental = devices.filter((d) => d.mobility === "rental").length;
  return `${total} ${total === 1 ? "Gerät" : "Geräte"} · ${maintenance} in Wartung · ${rental} Miete`;
}

/** `/geraete`: filters in the URL (`?typ=&standort=&mobilitaet=&status=`), list rendered on the server. */
export default async function GeraetePage({ searchParams }: GeraetePageProps) {
  const params = await searchParams;
  // Unknown enum values are dropped rather than forwarded, so a stale link does not turn into a 400.
  const filters: DeviceFilters = {
    deviceTypeId: first(params.typ),
    locationId: first(params.standort),
    mobility: oneOf(first(params.mobilitaet), MOBILITIES),
    status: oneOf(first(params.status), STATUSES),
  };

  const [devices, deviceTypes, locations] = await Promise.all([
    listDevices(filters, serverApiFetch),
    listDeviceTypes(serverApiFetch).then(toPickerOptions),
    listLocations(undefined, serverApiFetch).then(toPickerOptions),
  ]);

  return (
    <>
      <PageHeader title="Geräte" actions={<CreateDeviceButton deviceTypes={deviceTypes} locations={locations} />} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FiltersBar deviceTypes={deviceTypes} locations={locations} />
        <p className="text-sm text-muted-foreground tabular-nums">{summarize(devices)}</p>
      </div>
      <DevicesTable devices={devices} deviceTypes={deviceTypes} locations={locations} />
    </>
  );
}
