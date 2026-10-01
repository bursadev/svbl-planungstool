import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { ActiveBadge, MetaItem, MetaList, UrlTabs } from "@/components/data";
import { PageHeader } from "@/components/shell/page-header";
import { DevicesTable } from "@/components/standorte/devices-table";
import { LocationActions } from "@/components/standorte/location-actions";
import { RoomsPanel } from "@/components/standorte/rooms-panel";
import { UkBadge } from "@/components/standorte/uk-badge";
import { Card, CardContent } from "@/components/ui/card";
import { listDevicesAtLocation } from "@/lib/api/devices";
import { getLocation } from "@/lib/api/locations";
import { ApiError, serverApiFetch } from "@/lib/api/server";
import { formatAddress } from "@/lib/format";
import { LANGUAGE_LABELS, LOCATION_KIND_LABELS } from "@/lib/labels";

type StandortPageProps = {
  params: Promise<{ id: string }>;
};

/** One request per render: `generateMetadata` and the page share the result. */
const loadLocation = cache((id: string) => getLocation(id, serverApiFetch));

/** 404 for an unknown id, 400 for a malformed one: both are «Nicht gefunden» for the user. */
function isMissing(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.status === 400);
}

export async function generateMetadata({ params }: StandortPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const location = await loadLocation(id);
    return { title: location.name };
  } catch {
    return { title: "Standort" };
  }
}

export default async function StandortPage({ params }: StandortPageProps) {
  const { id } = await params;
  const [location, devices] = await Promise.all([
    loadLocation(id).catch((error: unknown) => {
      if (isMissing(error)) return null;
      throw error;
    }),
    // The Geräte tab degrades to a message when the endpoint is unavailable.
    listDevicesAtLocation(id, serverApiFetch).catch(() => null),
  ]);
  if (!location) notFound();

  const address = formatAddress(location);
  const hasContact = Boolean(location.contactName || location.contactEmail || location.contactPhone);

  return (
    <>
      <div className="flex flex-col gap-1">
        <Link
          href="/standorte"
          className="inline-flex w-fit items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon aria-hidden className="size-3.5" />
          Standorte
        </Link>
        <PageHeader title={location.name} actions={<LocationActions location={location} />} />
      </div>

      <Card size="sm">
        <CardContent>
          <MetaList>
            <MetaItem label="Code">
              <span className="font-mono">{location.code}</span>
            </MetaItem>
            <MetaItem label="Art">
              <span className="inline-flex items-center gap-2">
                {LOCATION_KIND_LABELS[location.kind]}
                {location.hostsUk ? <UkBadge /> : null}
              </span>
            </MetaItem>
            <MetaItem label="Adresse">{address || <span className="text-muted-foreground">–</span>}</MetaItem>
            <MetaItem label="Sprachregion">{LANGUAGE_LABELS[location.languageRegion]}</MetaItem>
            <MetaItem label="Parallele Kurse">
              <span className="font-mono tabular-nums">{location.parallelCourseCapacity}</span>
            </MetaItem>
            <MetaItem label="Kontakt">
              {hasContact ? (
                <span className="inline-flex flex-wrap items-center gap-x-2">
                  {location.contactName ? <span>{location.contactName}</span> : null}
                  {location.contactEmail ? (
                    <a href={`mailto:${location.contactEmail}`} className="text-accent hover:underline">
                      {location.contactEmail}
                    </a>
                  ) : null}
                  {location.contactPhone ? (
                    <a href={`tel:${location.contactPhone}`} className="text-accent hover:underline">
                      {location.contactPhone}
                    </a>
                  ) : null}
                </span>
              ) : (
                <span className="text-muted-foreground">–</span>
              )}
            </MetaItem>
            <MetaItem label="Status">
              <ActiveBadge active={location.active} />
            </MetaItem>
          </MetaList>
        </CardContent>
      </Card>

      <UrlTabs
        tabs={[
          {
            value: "raeume",
            label: (
              <>
                Räume
                <span className="font-mono text-xs text-muted-foreground tabular-nums">{location.rooms.length}</span>
              </>
            ),
            content: <RoomsPanel locationId={location.id} rooms={location.rooms} />,
          },
          {
            value: "geraete",
            label: (
              <>
                Geräte
                {devices ? (
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">{devices.length}</span>
                ) : null}
              </>
            ),
            content: <DevicesTable devices={devices} />,
          },
        ]}
      />
    </>
  );
}
