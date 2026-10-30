import type { Metadata } from "next";
import { CreateSchoolButton } from "@/components/berufsschulen/create-school-button";
import { SchoolFiltersBar } from "@/components/berufsschulen/filters-bar";
import { SchoolsTable } from "@/components/berufsschulen/schools-table";
import { ArchiveFilter, CsvMenu, ResetFilters, SearchInput } from "@/components/data";
import { PageHeader } from "@/components/shell/page-header";
import { listLocations } from "@/lib/api/locations";
import { serverApiFetch } from "@/lib/api/server";
import {
  VOCATIONAL_SCHOOLS_PATH,
  listVocationalSchools,
  vocationalSchoolQuery,
  type VocationalSchoolFilters,
} from "@/lib/api/vocational-schools";
import { first, hasFilters, oneOf, readListParams, uuidParam, type SearchParams } from "@/lib/list-params";

export const metadata: Metadata = { title: "Berufsschulen" };

const SORTABLE = ["name", "location"] as const;

/**
 * `/berufsschulen`: schools with their classes, rendered on the server with the signed-in user's
 * token. About 30 schools, so no paging. Filters in the URL: `q`, `sprache`, `standort`, `archiv`.
 */
export default async function BerufsschulenPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const list = readListParams(params, SORTABLE);
  const filters: Omit<VocationalSchoolFilters, "page" | "pageSize" | "sort" | "dir"> = {
    q: first(params.q),
    language: oneOf(params.sprache, ["de", "fr", "it"]),
    nearestLocationId: uuidParam(params.standort),
    archive: list.archive,
  };

  const [schools, locations] = await Promise.all([
    listVocationalSchools({ ...filters, sort: list.sort, dir: list.dir }, serverApiFetch),
    listLocations(undefined, serverApiFetch),
  ]);
  // The ÜK-Standort picker only needs id, name and the ÜK flag; rooms stay on the server.
  const locationOptions = locations.map(({ id, name, hostsUk }) => ({ id, name, hostsUk }));
  const ukLocations = locationOptions.filter((location) => location.hostsUk);

  return (
    <>
      <div className="flex flex-col gap-1">
        <PageHeader
          title="Berufsschulen"
          actions={
            <>
              <CsvMenu
                basePath={VOCATIONAL_SCHOOLS_PATH}
                plural="Berufsschulen"
                filters={vocationalSchoolQuery(filters)}
                filtered={hasFilters(params)}
              />
              <CreateSchoolButton locations={locationOptions} />
            </>
          }
        />
        <p className="text-sm text-muted-foreground">
          Die Schul-Exporte sind die Quelle für die Lernenden; hier werden Standort-Zuordnung, Klassen,
          Schultage und Ferien gepflegt.
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput placeholder="Name, Kurzname, Ort, Kontakt" className="w-72" />
          <SchoolFiltersBar locations={ukLocations} />
          <ArchiveFilter />
          <ResetFilters />
        </div>
        <SchoolsTable schools={schools} />
      </div>
    </>
  );
}
