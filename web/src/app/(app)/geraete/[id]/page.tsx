import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { MetaItem, MetaList } from "@/components/data/meta";
import { StatusDot } from "@/components/data/status-dot";
import { DeviceActions } from "@/components/geraete/device-actions";
import { DEVICE_STATUS_TONES, toPickerOptions } from "@/components/geraete/labels";
import { MaintenancePanel } from "@/components/geraete/maintenance-panel";
import { MovesPanel } from "@/components/geraete/moves-panel";
import { DEVICE_CATEGORY_LABELS } from "@/lib/labels";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { listDeviceTypes } from "@/lib/api/device-types";
import { getDevice } from "@/lib/api/devices";
import { listLocations } from "@/lib/api/locations";
import { ApiError, serverApiFetch } from "@/lib/api/server";
import { formatDate } from "@/lib/format";
import { DEVICE_MOBILITY_LABELS, DEVICE_STATUS_LABELS } from "@/lib/labels";

type GeraetPageProps = {
  params: Promise<{ id: string }>;
};

/** One request per render: `generateMetadata` and the page share the result. */
const loadDevice = cache((id: string) => getDevice(id, serverApiFetch));

/** 404 for an unknown id, 400 for a malformed one: both are «Nicht gefunden» for the user. */
function isMissing(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.status === 400);
}

export async function generateMetadata({ params }: GeraetPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const device = await loadDevice(id);
    return { title: device.inventoryNumber };
  } catch {
    return { title: "Gerät" };
  }
}

export default async function GeraetPage({ params }: GeraetPageProps) {
  const { id } = await params;
  const [device, deviceTypes, locations] = await Promise.all([
    loadDevice(id).catch((error: unknown) => {
      if (isMissing(error)) return null;
      throw error;
    }),
    listDeviceTypes(serverApiFetch).then(toPickerOptions),
    listLocations(undefined, serverApiFetch).then(toPickerOptions),
  ]);
  if (!device) notFound();

  const away = device.currentLocation.id !== device.homeLocation.id;
  const rental = device.mobility === "rental";
  const rentalPeriod =
    device.rentalFrom && device.rentalUntil
      ? `${formatDate(device.rentalFrom)} – ${formatDate(device.rentalUntil)}`
      : device.rentalFrom
        ? `ab ${formatDate(device.rentalFrom)}`
        : device.rentalUntil
          ? `bis ${formatDate(device.rentalUntil)}`
          : null;

  return (
    <>
      <div className="flex flex-col gap-1">
        <Link
          href="/geraete"
          className="inline-flex w-fit items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon aria-hidden className="size-3.5" />
          Geräte
        </Link>
        <PageHeader
          title={device.inventoryNumber}
          actions={<DeviceActions device={device} deviceTypes={deviceTypes} locations={locations} />}
        />
      </div>

      <Card size="sm">
        <CardContent>
          <MetaList>
            <MetaItem label="Typ">
              {device.deviceType.name}{" "}
              <span className="font-mono text-xs text-muted-foreground">{device.deviceType.code}</span>
              <span className="text-muted-foreground"> · {DEVICE_CATEGORY_LABELS[device.deviceType.category]}</span>
            </MetaItem>
            <MetaItem label="Heimstandort">{device.homeLocation.name}</MetaItem>
            <MetaItem label="Standort heute">
              {device.currentLocation.name}
              {away ? <span className="text-xs text-muted-foreground"> (verschoben)</span> : null}
            </MetaItem>
            <MetaItem label="Mobilität">{DEVICE_MOBILITY_LABELS[device.mobility]}</MetaItem>
            <MetaItem label="Status">
              <StatusDot tone={DEVICE_STATUS_TONES[device.status]} label={DEVICE_STATUS_LABELS[device.status]} />
            </MetaItem>
            {rental ? (
              <>
                <MetaItem label="Mietzeitraum">
                  {rentalPeriod ?? <span className="text-muted-foreground">–</span>}
                </MetaItem>
                <MetaItem label="Anbieter">
                  {device.rentalVendor ?? <span className="text-muted-foreground">–</span>}
                </MetaItem>
              </>
            ) : null}
            {device.notes ? (
              <MetaItem label="Notizen" className="basis-full">
                <span className="whitespace-pre-line text-muted-foreground">{device.notes}</span>
              </MetaItem>
            ) : null}
          </MetaList>
        </CardContent>
      </Card>

      <MovesPanel device={device} locations={locations} />
      <MaintenancePanel device={device} />
    </>
  );
}
