import type { Metadata } from "next";
import { ArchiveFilter, CsvMenu, Pagination, ResetFilters, SearchInput } from "@/components/data";
import { UrlSelect } from "@/components/data/url-select";
import { ApprenticesTable } from "@/components/lernende/apprentices-table";
import { LernendeTabs } from "@/components/lernende/lernende-tabs";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  APPRENTICES_PATH,
  apprenticeQuery,
  listApprenticesPage,
  type ApprenticeFilters,
} from "@/lib/api/apprentices";
import { listCohorts } from "@/lib/api/curriculum";
import { serverApiFetch } from "@/lib/api/server";
import { listVocationalSchools } from "@/lib/api/vocational-schools";
import { LANGUAGES, LANGUAGE_LABELS, TRACK_LABELS } from "@/lib/labels";
import { first, hasFilters, oneOf, readListParams, uuidParam, type SearchParams } from "@/lib/list-params";

export const metadata: Metadata = { title: "Lernende" };

const SORTABLE = ["name", "school", "cohort", "company"] as const;

const TRACK_OPTIONS = Object.entries(TRACK_LABELS).map(([value, label]) => ({ value, label }));
const LANGUAGE_OPTIONS = LANGUAGES.map((value) => ({ value, label: LANGUAGE_LABELS[value] }));

/**
 * `/lernende`: read-only, paged list with the filters in the URL (`?q=&schule=&jahrgang=&lehrgang=
 * &sprache=&archiv=`). Export only: the school export is the source, so no import and no bulk
 * actions. «Archiviert» are the finished and dropped Lernende.
 */
export default async function LernendePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const list = readListParams(params, SORTABLE);
  const filters: Omit<ApprenticeFilters, "page" | "pageSize" | "sort" | "dir"> = {
    q: first(params.q),
    vocationalSchoolId: uuidParam(params.schule),
    cohortId: uuidParam(params.jahrgang),
    track: oneOf(params.lehrgang, ["efz", "eba"]),
    language: oneOf(params.sprache, ["de", "fr", "it"]),
    archive: list.archive,
  };
  const [page, schools, cohorts] = await Promise.all([
    listApprenticesPage({ ...filters, ...list }, serverApiFetch),
    listVocationalSchools(undefined, serverApiFetch),
    listCohorts(serverApiFetch),
  ]);

  return (
    <>
      <PageHeader
        title="Lernende"
        actions={
          <CsvMenu
            basePath={APPRENTICES_PATH}
            plural="Lernende"
            filters={apprenticeQuery(filters)}
            filtered={hasFilters(params)}
            importable={false}
          />
        }
      />
      <LernendeTabs />
      <Card size="sm">
        <CardContent className="text-muted-foreground">
          Lernende werden nicht im Tool bearbeitet. Der Export der Berufsschule ist die Quelle. Import: kommt mit
          dem Import-Schritt.
        </CardContent>
      </Card>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput placeholder="Name, E-Mail, Lehrbetrieb, Klasse" className="w-72" />
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
          <UrlSelect param="sprache" label="Sprache" allLabel="Alle Sprachen" options={LANGUAGE_OPTIONS} />
          <ArchiveFilter />
          <ResetFilters />
        </div>
        <ApprenticesTable apprentices={page.items} sortable />
        <Pagination total={page.total} page={list.page} pageSize={list.pageSize} />
      </div>
    </>
  );
}
