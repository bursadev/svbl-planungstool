import type { Metadata } from "next";
import { SearchInput } from "@/components/data/search-input";
import { UrlSelect } from "@/components/data/url-select";
import { KundenTabs } from "@/components/kunden/kunden-tabs";
import { ParticipantsPanel } from "@/components/kunden/participants-panel";
import { PageHeader } from "@/components/shell/page-header";
import { listCustomers, listParticipants } from "@/lib/api/customers";
import { serverApiFetch } from "@/lib/api/server";

export const metadata: Metadata = { title: "Teilnehmende" };

type TeilnehmendePageProps = {
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

/** `/kunden/teilnehmende`: every adult participant across Kunden (`?q=&kunde=`). */
export default async function TeilnehmendePage({ searchParams }: TeilnehmendePageProps) {
  const params = await searchParams;
  const filters = { q: first(params.q), customerId: uuid(first(params.kunde)) };
  const [participants, customers] = await Promise.all([
    listParticipants(filters, serverApiFetch),
    listCustomers(undefined, serverApiFetch),
  ]);
  const customerOptions = customers.map(({ id, name }) => ({ id, name }));

  return (
    <>
      <PageHeader title="Kunden" />
      <KundenTabs />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Name" className="w-72" />
        <UrlSelect
          param="kunde"
          label="Kunde"
          allLabel="Alle Kunden"
          options={customerOptions.map(({ id, name }) => ({ value: id, label: name }))}
          className="w-56"
        />
      </div>
      <ParticipantsPanel participants={participants} customers={customerOptions} />
    </>
  );
}
