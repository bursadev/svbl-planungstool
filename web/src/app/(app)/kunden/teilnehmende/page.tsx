import type { Metadata } from "next";
import { CsvMenu, Pagination, ResetFilters, SearchInput, UrlSelect } from "@/components/data";
import { KundenTabs } from "@/components/kunden/kunden-tabs";
import { ParticipantsPanel } from "@/components/kunden/participants-panel";
import { PageHeader } from "@/components/shell/page-header";
import {
  PARTICIPANTS_PATH,
  listCustomers,
  listParticipantsPage,
  participantQuery,
  type ParticipantFilters,
} from "@/lib/api/customers";
import { serverApiFetch } from "@/lib/api/server";
import { first, hasFilters, readListParams, uuidParam, type SearchParams } from "@/lib/list-params";

export const metadata: Metadata = { title: "Teilnehmende" };

const SORTABLE = ["name"] as const;

/**
 * `/kunden/teilnehmende`: every adult participant across Kunden. Filters, sorting and paging live
 * in the URL: `q`, `kunde`. Teilnehmende cannot be archived, so there is no archive filter.
 */
export default async function TeilnehmendePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  // Teilnehmende have no archive: only paging and sorting are passed on.
  const { page: pageNumber, pageSize, sort, dir } = readListParams(params, SORTABLE);
  const filters: Omit<ParticipantFilters, "page" | "pageSize" | "sort" | "dir"> = {
    q: first(params.q),
    customerId: uuidParam(params.kunde),
  };
  const [page, customers] = await Promise.all([
    listParticipantsPage({ ...filters, page: pageNumber, pageSize, sort, dir }, serverApiFetch),
    listCustomers({}, serverApiFetch),
  ]);
  const customerOptions = customers.map(({ id, name }) => ({ id, name }));

  return (
    <>
      <PageHeader
        title="Kunden"
        actions={
          <CsvMenu
            basePath={PARTICIPANTS_PATH}
            plural="Teilnehmende"
            filters={participantQuery(filters)}
            filtered={hasFilters(params)}
          />
        }
      />
      <KundenTabs />
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput placeholder="Name, E-Mail, Kunde" className="w-72" />
          <UrlSelect
            param="kunde"
            label="Kunde"
            allLabel="Alle Kunden"
            options={customerOptions.map(({ id, name }) => ({ value: id, label: name }))}
            className="w-56"
          />
          <ResetFilters />
        </div>
        <ParticipantsPanel participants={page.items} customers={customerOptions} total={page.total} selectable />
        <Pagination total={page.total} page={pageNumber} pageSize={pageSize} />
      </div>
    </>
  );
}
