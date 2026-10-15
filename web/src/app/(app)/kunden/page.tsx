import type { Metadata } from "next";
import { SearchInput } from "@/components/data/search-input";
import { CreateCustomerButton } from "@/components/kunden/create-customer-button";
import { CustomersTable } from "@/components/kunden/customers-table";
import { KundenTabs } from "@/components/kunden/kunden-tabs";
import { PageHeader } from "@/components/shell/page-header";
import { listCustomers } from "@/lib/api/customers";
import { serverApiFetch } from "@/lib/api/server";

export const metadata: Metadata = { title: "Kunden" };

type KundenPageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

/** `/kunden`: companies booking adult or on-site courses; Abacus/OdAOrg stay the leading systems. */
export default async function KundenPage({ searchParams }: KundenPageProps) {
  const params = await searchParams;
  const q = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() || undefined;
  const customers = await listCustomers(q, serverApiFetch);

  return (
    <>
      <PageHeader title="Kunden" actions={<CreateCustomerButton />} />
      <KundenTabs />
      <SearchInput placeholder="Name oder Ort" className="w-72" />
      <CustomersTable customers={customers} />
    </>
  );
}
