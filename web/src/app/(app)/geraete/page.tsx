import type { Metadata } from "next";
import { ArchiveFilter, CsvMenu, Pagination, ResetFilters, SearchInput } from "@/components/data";
import { CreateDeviceButton } from "@/components/geraete/create-device-button";
import { DevicesTable } from "@/components/geraete/devices-table";
import { FiltersBar } from "@/components/geraete/filters-bar";
import { toPickerOptions } from "@/components/geraete/labels";
import { PageHeader } from "@/components/shell/page-header";
import { listDeviceTypes } from "@/lib/api/device-types";
import { DEVICES_PATH, listDevicesPage, type DeviceFilters } from "@/lib/api/devices";
import { listLocations } from "@/lib/api/locations";
import { serverApiFetch } from "@/lib/api/server";
import { first, hasFilters, oneOf, readListParams, uuidParam, type SearchParams } from "@/lib/list-params";

export const metadata: Metadata = { title: "Geräte" };

const SORTABLE = ["inventoryNumber", "type", "location"] as const;

/**
 * `/geraete`: the list with its filters, sorting and paging in the URL. Filters: `q`, `typ`,
 * `standort`, `mobilitaet`, `status` (verfügbar, in Wartung) and `archiv`; retired devices are
 * the archive and hidden by default.
 */
export default async function GeraetePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const list = readListParams(params, SORTABLE);
  // Unknown values are dropped rather than forwarded, so a stale link does not turn into a 400.
  const filters: Omit<DeviceFilters, "page" | "pageSize" | "sort" | "dir"> = {
    q: first(params.q),
    deviceTypeId: uuidParam(params.typ),
    locationId: uuidParam(params.standort),
    mobility: oneOf(params.mobilitaet, ["fixed", "mobile", "rental"]),
    status: oneOf(params.status, ["available", "maintenance"]),
    archive: list.archive,
  };

  const [page, deviceTypes, locations] = await Promise.all([
    listDevicesPage({ ...filters, ...list }, serverApiFetch),
    listDeviceTypes(serverApiFetch).then(toPickerOptions),
    listLocations(undefined, serverApiFetch).then(toPickerOptions),
  ]);

  return (
    <>
      <PageHeader
        title="Geräte"
        actions={
          <>
            <CsvMenu basePath={DEVICES_PATH} plural="Geräte" filters={filters} filtered={hasFilters(params)} />
            <CreateDeviceButton deviceTypes={deviceTypes} locations={locations} />
          </>
        }
      />
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput placeholder="Inventar, Typ, Standort, Notizen" className="w-72" />
          <FiltersBar deviceTypes={deviceTypes} locations={locations} />
          <ArchiveFilter />
          <ResetFilters />
        </div>
        <DevicesTable devices={page.items} deviceTypes={deviceTypes} locations={locations} />
        <Pagination total={page.total} page={list.page} pageSize={list.pageSize} />
      </div>
    </>
  );
}
