import type { Metadata } from "next";
import { ArchiveFilter, CsvMenu, Pagination, ResetFilters, SearchInput, UrlTabs } from "@/components/data";
import { PageHeader } from "@/components/shell/page-header";
import { CreateLocationButton } from "@/components/standorte/create-location-button";
import { DistancesPanel } from "@/components/standorte/distances-panel";
import { LocationFiltersBar } from "@/components/standorte/filters-bar";
import { LocationsTable } from "@/components/standorte/locations-table";
import {
  LOCATIONS_PATH,
  listLocationCantons,
  listLocationDistances,
  listLocations,
  listLocationsPage,
  locationQuery,
  type LocationFilters,
} from "@/lib/api/locations";
import { serverApiFetch } from "@/lib/api/server";
import { first, hasFilters, oneOf, readListParams, type SearchParams } from "@/lib/list-params";

export const metadata: Metadata = { title: "Standorte" };

const SORTABLE = ["name", "code", "city", "capacity"] as const;

/**
 * `/standorte`: the list with its filters, sorting and paging in the URL, and the Reisezeiten
 * matrix in URL tabs (`?tab=`). Filters: `q`, `art`, `sprache`, `uek`, `kanton`, `archiv`.
 */
export default async function StandortePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const list = readListParams(params, SORTABLE);
  const uek = oneOf(params.uek, ["ja", "nein"]);
  const filters: Omit<LocationFilters, "page" | "pageSize" | "sort" | "dir"> = {
    q: first(params.q),
    kind: oneOf(params.art, ["training_centre", "customer_site"]),
    languageRegion: oneOf(params.sprache, ["de", "fr", "it"]),
    hostsUk: uek === undefined ? undefined : uek === "ja",
    canton: first(params.kanton),
    archive: list.archive,
  };

  const [page, allLocations, distances, cantons] = await Promise.all([
    listLocationsPage({ ...filters, ...list }, serverApiFetch),
    // The matrix always covers every active training centre, independent of the filters.
    listLocations({ kind: "training_centre", archive: "active" }, serverApiFetch),
    listLocationDistances(serverApiFetch),
    listLocationCantons(serverApiFetch).catch(() => []),
  ]);
  const centres = allLocations.map(({ id, code, name }) => ({ id, code, name }));

  return (
    <>
      <PageHeader
        title="Standorte"
        actions={
          <>
            <CsvMenu
              basePath={LOCATIONS_PATH}
              plural="Standorte"
              filters={locationQuery(filters)}
              filtered={hasFilters(params)}
            />
            <CreateLocationButton />
          </>
        }
      />
      <UrlTabs
        tabs={[
          {
            value: "liste",
            label: "Standorte",
            content: (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <SearchInput placeholder="Name, Code, Ort, Kontakt" className="w-72" />
                  <LocationFiltersBar cantons={cantons} />
                  <ArchiveFilter />
                  <ResetFilters />
                </div>
                <LocationsTable locations={page.items} />
                <Pagination total={page.total} page={list.page} pageSize={list.pageSize} />
              </div>
            ),
          },
          {
            value: "reisezeiten",
            label: "Reisezeiten",
            content: <DistancesPanel locations={centres} distances={distances} />,
          },
        ]}
      />
    </>
  );
}
