import type { Metadata } from "next";
import { ArchiveFilter, CsvMenu, Pagination, ResetFilters, SearchInput } from "@/components/data";
import { CreateCustomerButton } from "@/components/kunden/create-customer-button";
import { CustomersTable } from "@/components/kunden/customers-table";
import { KundenTabs } from "@/components/kunden/kunden-tabs";
import { PageHeader } from "@/components/shell/page-header";
import { CUSTOMERS_PATH, customerQuery, listCustomersPage, type CustomerFilters } from "@/lib/api/customers";
import { serverApiFetch } from "@/lib/api/server";
import { first, hasFilters, readListParams, type SearchParams } from "@/lib/list-params";

export const metadata: Metadata = { title: "Kunden" };

const SORTABLE = ["name", "city"] as const;

/**
 * `/kunden`: companies booking adult or on-site courses; Abacus/OdAOrg stay the leading systems.
 * Filters, sorting and paging live in the URL: `q`, `archiv`.
 */
export default async function KundenPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const list = readListParams(params, SORTABLE);
  const filters: Omit<CustomerFilters, "page" | "pageSize" | "sort" | "dir"> = {
    q: first(params.q),
    archive: list.archive,
  };
  const page = await listCustomersPage({ ...filters, ...list }, serverApiFetch);

  return (
    <>
      <PageHeader
        title="Kunden"
        actions={
          <>
            <CsvMenu
              basePath={CUSTOMERS_PATH}
              plural="Kunden"
              filters={customerQuery(filters)}
              filtered={hasFilters(params)}
            />
            <CreateCustomerButton />
          </>
        }
      />
      <KundenTabs />
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput placeholder="Name, Ort, Kontakt, Ref." className="w-72" />
          <ArchiveFilter />
          <ResetFilters />
        </div>
        <CustomersTable customers={page.items} />
        <Pagination total={page.total} page={list.page} pageSize={list.pageSize} />
      </div>
    </>
  );
}
