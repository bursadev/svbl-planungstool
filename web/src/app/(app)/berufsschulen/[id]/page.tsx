import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { HolidaysPanel } from "@/components/berufsschulen/holidays-panel";
import { SchoolActions } from "@/components/berufsschulen/school-actions";
import { SchoolClassesPanel } from "@/components/berufsschulen/school-classes-panel";
import { ActiveBadge, MetaItem, MetaList, UrlTabs } from "@/components/data";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { listLocations } from "@/lib/api/locations";
import { ApiError, serverApiFetch } from "@/lib/api/server";
import { getVocationalSchool, listSchoolHolidays } from "@/lib/api/vocational-schools";
import { LANGUAGE_LABELS, formatAddress } from "@/lib/format";

type BerufsschuleDetailPageProps = {
  params: Promise<{ id: string }>;
};

/** One request per render: `generateMetadata` and the page share the result. */
const loadSchool = cache((id: string) => getVocationalSchool(id, serverApiFetch));

/** 404 for an unknown id, 400 for a malformed one: both are «Nicht gefunden» for the user. */
function isMissing(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.status === 400);
}

export async function generateMetadata({ params }: BerufsschuleDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const school = await loadSchool(id);
    return { title: school.name };
  } catch {
    return { title: "Berufsschule" };
  }
}

export default async function BerufsschuleDetailPage({ params }: BerufsschuleDetailPageProps) {
  const { id } = await params;
  const [school, locations] = await Promise.all([
    loadSchool(id).catch((error: unknown) => {
      if (isMissing(error)) return null;
      throw error;
    }),
    listLocations(undefined, serverApiFetch),
  ]);
  if (!school) notFound();
  const holidays = await listSchoolHolidays(school.id, serverApiFetch);
  // The ÜK-Standort picker only needs id, name and the ÜK flag.
  const locationOptions = locations.map(({ id: locationId, name, hostsUk }) => ({ id: locationId, name, hostsUk }));

  const address = formatAddress(school);

  return (
    <>
      <div className="flex flex-col gap-1">
        <Link
          href="/berufsschulen"
          className="inline-flex w-fit items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon aria-hidden className="size-3.5" />
          Berufsschulen
        </Link>
        <PageHeader title={school.name} actions={<SchoolActions school={school} locations={locationOptions} />} />
      </div>

      <Card size="sm">
        <CardContent>
          <MetaList>
            <MetaItem label="Kurzname">{school.shortName}</MetaItem>
            <MetaItem label="Sprache">{LANGUAGE_LABELS[school.language]}</MetaItem>
            <MetaItem label="ÜK-Standort">
              <Link href={`/standorte/${school.nearestLocation.id}`} className="hover:underline">
                {school.nearestLocation.name}
              </Link>
            </MetaItem>
            {address ? <MetaItem label="Adresse">{address}</MetaItem> : null}
            {school.contactName || school.contactEmail ? (
              <MetaItem label="Kontakt">
                {school.contactName}
                {school.contactName && school.contactEmail ? " · " : null}
                {school.contactEmail}
              </MetaItem>
            ) : null}
            <MetaItem label="Lernende">
              <span className="font-mono tabular-nums">{school.apprenticeCount}</span>
            </MetaItem>
            <MetaItem label="Status">
              <ActiveBadge active={school.active} />
            </MetaItem>
          </MetaList>
        </CardContent>
      </Card>

      <UrlTabs
        tabs={[
          {
            value: "klassen",
            label: (
              <>
                Klassen
                <span className="font-mono text-xs text-muted-foreground tabular-nums">{school.classes.length}</span>
              </>
            ),
            content: <SchoolClassesPanel school={school} />,
          },
          {
            value: "ferien",
            label: (
              <>
                Ferien
                <span className="font-mono text-xs text-muted-foreground tabular-nums">{holidays.length}</span>
              </>
            ),
            content: <HolidaysPanel schoolId={school.id} holidays={holidays} />,
          },
        ]}
      />
    </>
  );
}
