import type { Metadata } from "next";
import { SearchInput } from "@/components/data/search-input";
import { CompaniesTable } from "@/components/lehrbetriebe/companies-table";
import { CreateCompanyButton } from "@/components/lehrbetriebe/create-company-button";
import { LernendeTabs } from "@/components/lernende/lernende-tabs";
import { PageHeader } from "@/components/shell/page-header";
import { serverApiFetch } from "@/lib/api/server";
import { listTrainingCompanies } from "@/lib/api/training-companies";

export const metadata: Metadata = { title: "Lehrbetriebe" };

type LehrbetriebePageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

/** `/lernende/lehrbetriebe`: the employers of the Lernenden, with their Berufsbildner. */
export default async function LehrbetriebePage({ searchParams }: LehrbetriebePageProps) {
  const params = await searchParams;
  const q = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() || undefined;
  const companies = await listTrainingCompanies(q, serverApiFetch);

  return (
    <>
      <PageHeader title="Lernende" actions={<CreateCompanyButton />} />
      <LernendeTabs />
      <SearchInput placeholder="Name oder Ort" className="w-72" />
      <CompaniesTable companies={companies} />
    </>
  );
}
