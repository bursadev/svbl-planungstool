import type { Metadata } from "next";
import { ArchiveFilter, CsvMenu, Pagination, ResetFilters, SearchInput } from "@/components/data";
import { CompaniesTable } from "@/components/lehrbetriebe/companies-table";
import { CreateCompanyButton } from "@/components/lehrbetriebe/create-company-button";
import { LernendeTabs } from "@/components/lernende/lernende-tabs";
import { PageHeader } from "@/components/shell/page-header";
import { serverApiFetch } from "@/lib/api/server";
import {
  TRAINING_COMPANIES_PATH,
  listTrainingCompaniesPage,
  trainingCompanyQuery,
  type TrainingCompanyFilters,
} from "@/lib/api/training-companies";
import { first, hasFilters, readListParams, type SearchParams } from "@/lib/list-params";

export const metadata: Metadata = { title: "Lehrbetriebe" };

const SORTABLE = ["name", "city"] as const;

/**
 * `/lernende/lehrbetriebe`: the employers of the Lernenden, with their Berufsbildner on the detail
 * page. Filters, sorting and paging live in the URL: `q`, `archiv`.
 */
export default async function LehrbetriebePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const list = readListParams(params, SORTABLE);
  const filters: Omit<TrainingCompanyFilters, "page" | "pageSize" | "sort" | "dir"> = {
    q: first(params.q),
    archive: list.archive,
  };
  const page = await listTrainingCompaniesPage({ ...filters, ...list }, serverApiFetch);

  return (
    <>
      <PageHeader
        title="Lernende"
        actions={
          <>
            <CsvMenu
              basePath={TRAINING_COMPANIES_PATH}
              plural="Lehrbetriebe"
              filters={trainingCompanyQuery(filters)}
              filtered={hasFilters(params)}
            />
            <CreateCompanyButton />
          </>
        }
      />
      <LernendeTabs />
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput placeholder="Name, PLZ, Ort, E-Mail, Ref." className="w-72" />
          <ArchiveFilter />
          <ResetFilters />
        </div>
        <CompaniesTable companies={page.items} />
        <Pagination total={page.total} page={list.page} pageSize={list.pageSize} />
      </div>
    </>
  );
}
