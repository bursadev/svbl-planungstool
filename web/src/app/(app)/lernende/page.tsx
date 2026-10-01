import type { Metadata } from "next";
import { SearchInput } from "@/components/data/search-input";
import { UrlSelect } from "@/components/data/url-select";
import { ApprenticesTable } from "@/components/lernende/apprentices-table";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { listApprentices, listCohortOptions } from "@/lib/api/apprentices";
import { serverApiFetch } from "@/lib/api/server";
import { listVocationalSchools } from "@/lib/api/vocational-schools";
import { TRACK_LABELS, type Track } from "@/lib/format";

export const metadata: Metadata = { title: "Lernende" };

type LernendePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function first(value: string | string[] | undefined): string | undefined {
  return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
}

/** The API validates ids as UUIDs (400 otherwise); anything else is treated as «Alle». */
function uuid(value: string | undefined): string | undefined {
  return value && UUID.test(value) ? value : undefined;
}

function track(value: string | undefined): Track | undefined {
  return value === "efz" || value === "eba" ? value : undefined;
}

const TRACK_OPTIONS = Object.entries(TRACK_LABELS).map(([value, label]) => ({ value, label }));

/** `/lernende`: read-only list with the filters in the URL (`?q=&schule=&jahrgang=&lehrgang=`). */
export default async function LernendePage({ searchParams }: LernendePageProps) {
  const params = await searchParams;
  const filters = {
    q: first(params.q),
    vocationalSchoolId: uuid(first(params.schule)),
    cohortId: uuid(first(params.jahrgang)),
    track: track(first(params.lehrgang)),
  };
  const [apprentices, schools, cohorts] = await Promise.all([
    listApprentices(filters, serverApiFetch),
    listVocationalSchools(serverApiFetch),
    listCohortOptions(serverApiFetch),
  ]);

  return (
    <>
      <PageHeader title="Lernende" />
      <Card size="sm">
        <CardContent className="text-muted-foreground">
          Lernende werden nicht im Tool bearbeitet. Der Export der Berufsschule ist die Quelle. Import: kommt mit
          dem Import-Schritt.
        </CardContent>
      </Card>
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Name" className="w-72" />
        <UrlSelect
          param="schule"
          label="Berufsschule"
          allLabel="Alle Berufsschulen"
          options={schools.map((school) => ({ value: school.id, label: school.name }))}
          className="w-56"
        />
        <UrlSelect
          param="jahrgang"
          label="Jahrgang"
          allLabel="Alle Jahrgänge"
          options={cohorts.map((cohort) => ({ value: cohort.id, label: cohort.label }))}
          className="w-44"
        />
        <UrlSelect
          param="lehrgang"
          label="Lehrgang"
          allLabel="Alle Lehrgänge"
          options={TRACK_OPTIONS}
          className="w-40"
        />
      </div>
      <ApprenticesTable apprentices={apprentices} />
    </>
  );
}
